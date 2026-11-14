// Realtime room connection: WebSocket over the same-origin /api path (works on Wi-Fi/4G/5G via HTTPS),
// with heartbeat + stale-socket watchdog, immediate reconnection on resume/network change,
// monotonic `seq` ordering and a unique `aid` on every action so the server drops duplicates.
import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomState, ServerError } from "./types";

export type ConnStatus = "connecting" | "online" | "offline";
export type Fatal = "removed" | "replaced" | "invalid_token" | "forbidden" | "not_found" | null;

const PING_MS = 5000; // heartbeat
const STALE_MS = 12000; // no traffic for this long => socket is dead (common after 4G/Wi-Fi switch)
const DUP_MS = 350; // identical action repeated within this window = accidental double tap

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useRoomSocket(code: string, role: "master" | "player", token: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [fatal, setFatal] = useState<Fatal>(null);
  const [error, setError] = useState<ServerError | null>(null);
  const [rejectedAt, setRejectedAt] = useState(0);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(-1);
  const lastSent = useRef<{ key: string; at: number }>({ key: "", at: 0 });

  useEffect(() => {
    if (!token) return;
    let stopped = false;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;
    let lastMsg = Date.now();

    // only re-render when the clock offset really moves (avoids churn on every message)
    const applyOffset = (o: number) => {
      if (offsetRef.current === null || Math.abs(o - offsetRef.current) > 40) {
        offsetRef.current = o;
        setOffset(o);
      }
    };

    const teardown = (ws: WebSocket | null) => {
      clearInterval(ping);
      if (!ws) return;
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      try {
        ws.close();
      } catch {
        /* already closed */
      }
    };

    const connect = () => {
      if (stopped) return;
      clearTimeout(retryTimer);
      teardown(wsRef.current);
      setStatus("connecting");
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(
        `${proto}://${window.location.host}/api/ws/${code}?role=${role}&token=${encodeURIComponent(token)}`,
      );
      wsRef.current = ws;
      ws.onopen = () => {
        retry = 0;
        lastMsg = Date.now();
        setStatus("online");
        ping = setInterval(() => {
          if (Date.now() - lastMsg > STALE_MS) {
            connect(); // half-open socket: replace it now instead of waiting for TCP timeouts
            return;
          }
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
        }, PING_MS);
      };
      ws.onmessage = (e) => {
        lastMsg = Date.now();
        let m: { type: string; state?: RoomState; code?: string; message?: string; server_now?: number; t?: number };
        try {
          m = JSON.parse(e.data as string);
        } catch {
          return;
        }
        if (m.type === "state" && m.state) {
          if (m.state.seq < seqRef.current) return; // out-of-order snapshot
          seqRef.current = m.state.seq;
          if (offsetRef.current === null) applyOffset(m.state.server_now - Date.now());
          setState(m.state);
          setFatal(null);
        } else if (m.type === "pong" && m.server_now && m.t) {
          applyOffset(m.server_now - (m.t + Date.now()) / 2); // RTT-compensated clock offset
        } else if (m.type === "error") {
          setError({ code: m.code ?? "error", message: m.message ?? "Errore", at: Date.now() });
        } else if (m.type === "buzz_rejected") {
          setRejectedAt(Date.now());
        } else if (m.type === "removed") {
          setFatal("removed"); // keep retrying: the MASTER may readmit the team
        } else if (m.type === "replaced") {
          setFatal("replaced");
          stopped = true;
        } else if (m.type === "fatal") {
          setFatal((m.code as Fatal) ?? "not_found");
          stopped = true;
        }
      };
      ws.onclose = () => {
        clearInterval(ping);
        setStatus("offline");
        if (stopped) return;
        retryTimer = setTimeout(connect, Math.min(500 * 2 ** retry, 5000));
        retry += 1;
      };
    };
    connect();

    const resume = () => {
      if (document.visibilityState !== "visible" || stopped) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || Date.now() - lastMsg > PING_MS + 1000) {
        retry = 0;
        connect();
      } else {
        ws.send(JSON.stringify({ type: "sync" }));
      }
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      teardown(wsRef.current);
      wsRef.current = null;
    };
  }, [code, role, token]);

  const send = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const key = action + JSON.stringify(payload);
    const now = performance.now();
    if (key === lastSent.current.key && now - lastSent.current.at < DUP_MS) return true;
    lastSent.current = { key, at: now };
    ws.send(JSON.stringify({ type: "action", action, aid: uid(), ...payload }));
    return true;
  }, []);

  return { state, status, fatal, error, send, offset, rejectedAt };
}
