import { memo, useEffect, useMemo, useRef, useState } from "react";
import { X, PartyPopper } from "lucide-react";
import type { RoomState, Track } from "@/lib/types";
import { sfx } from "@/lib/sfx";

type Overlay = { kind: "win" | "lose" | "wrong" | "skip"; id: string; teamName: string | null };

const COLORS = ["#EF4444", "#F59E0B", "#22C55E", "#38BDF8", "#A855F7", "#EC4899", "#FDE047"];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.2 + Math.random() * 1.8,
        dx: `${(Math.random() - 0.5) * 200}px`,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 8,
        round: Math.random() > 0.6,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" data-testid="confetti">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.round ? p.w : p.w * 1.6,
            background: p.color,
            borderRadius: p.round ? 9999 : 2,
            animation: `mb-fall ${p.dur}s ${p.delay}s cubic-bezier(.3,.6,.6,1) forwards`,
            ["--dx" as string]: p.dx,
          }}
        />
      ))}
    </div>
  );
}

export function TrackReveal({ track }: { track: Track }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-[clamp(0.4rem,1.2dvh,0.75rem)] text-left" data-testid="track-reveal">
      {track.artwork ? (
        <img src={track.artwork} alt="" className="size-[clamp(3.5rem,11dvh,6rem)] rounded-xl object-cover shadow-lg" />
      ) : (
        <div className="size-[clamp(3.5rem,11dvh,6rem)] rounded-xl bg-white/10" />
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 break-words font-heading text-[clamp(1rem,2.8dvh,1.25rem)] font-black leading-tight" data-testid="track-reveal-title">{track.title}</p>
        <p className="line-clamp-1 text-sm font-semibold text-white/80" data-testid="track-reveal-artist">{track.artist}</p>
        {track.year && <p className="text-sm text-white/60">{track.year}</p>}
      </div>
    </div>
  );
}

const Countdown = memo(function Countdown({ end, active, offset }: { end: number | null; active: boolean; offset: number }) {
  const [display, setDisplay] = useState<string | null>(null);
  const offRef = useRef(offset);
  offRef.current = offset;
  useEffect(() => {
    const offset = offRef.current;
    if (!end || !active) return;
    let last: string | null = null;
    const tick = () => {
      const remaining = end - (Date.now() + offset);
      let next: string | null = null;
      if (remaining > 0) next = String(Math.max(0, Math.min(3, Math.ceil(remaining / 1000) - 1)));
      else if (remaining > -1600) next = "GAME!";
      if (next !== last) {
        if (next === "GAME!") sfx.game();
        else if (next !== null) sfx.beep();
        last = next;
        setDisplay(next);
      }
    };
    tick();
    const iv = setInterval(tick, 80);
    const stop = setTimeout(() => {
      clearInterval(iv);
      setDisplay(null);
    }, Math.max(0, end - (Date.now() + offset)) + 1700);
    return () => {
      clearInterval(iv);
      clearTimeout(stop);
    };
  }, [end, active]);
  if (!display) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" data-testid="countdown-overlay">
      <span
        key={display}
        data-testid="countdown-value"
        className={display === "GAME!" ? "mb-pop mb-rainbow-text font-heading text-8xl font-black sm:text-9xl" : "mb-pop font-heading text-[10rem] font-black leading-none text-white"}
      >
        {display}
      </span>
    </div>
  );
});

export function GameOverlays({ state, role, myTeamId, offset }: { state: RoomState | null; role: "master" | "player"; myTeamId?: string | null; offset: number }) {
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const lastId = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ctx = useRef({ state, offset, role, myTeamId });
  ctx.current = { state, offset, role, myTeamId };
  const evId = state?.event?.id ?? null;

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    const { state, offset, role, myTeamId } = ctx.current;
    const ev = state?.event ?? null;
    if (!ev || ev.id === lastId.current) return;
    lastId.current = ev.id;
    if (Date.now() + offset - ev.ts > 6000) return; // stale event replayed on reconnect
    const team = state?.teams.find((t) => t.id === ev.team_id)?.name ?? null;
    let next: Overlay | null = null;
    let ms = 0;
    if (ev.type === "correct") {
      const iWon = role === "master" || ev.team_id === myTeamId;
      next = { kind: iWon ? "win" : "lose", id: ev.id, teamName: team };
      ms = 4500;
      if (iWon) sfx.correct();
      else sfx.sad();
    } else if (ev.type === "wrong") {
      next = { kind: "wrong", id: ev.id, teamName: team };
      ms = 1300;
      sfx.wrong();
    } else if (ev.type === "skip") {
      next = { kind: "skip", id: ev.id, teamName: null };
      ms = 4000;
      sfx.beep();
    } else if (ev.type === "buzz") {
      if (role === "master" || ev.team_id === myTeamId) sfx.buzz();
    } else if (ev.type === "open") {
      sfx.beep();
    }
    if (!next) return;
    setOverlay(next);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOverlay((o) => (o?.id === next.id ? null : o)), ms);
  }, [evId]);

  const track = state?.turn.track ?? null;
  const word = state?.turn.word ?? null;

  return (
    <>
      {state && <Countdown end={state.countdown_end} active={state.status === "countdown" || state.status === "playing"} offset={offset} />}
      {overlay?.kind === "win" && <Confetti />}
      {overlay && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 ${overlay.kind === "wrong" ? "bg-black/60" : "bg-black/75"}`}
          data-testid={`overlay-${overlay.kind}`}
        >
          <div className="mb-pop w-full max-w-md rounded-3xl border border-white/10 bg-[#131C2E] p-6 text-center shadow-2xl">
            {overlay.kind === "win" && (
              <>
                <PartyPopper className="mx-auto size-16 text-amber-400" />
                <p className="mt-2 font-heading text-4xl font-black text-emerald-400">RISPOSTA GIUSTA!</p>
                {overlay.teamName && <p className="mt-1 text-lg font-bold">+1 punto a {overlay.teamName}</p>}
              </>
            )}
            {overlay.kind === "lose" && (
              <>
                <img src="/sad-goose.webp" width={160} height={160} decoding="async" alt="Oca triste" className="mb-float mx-auto size-[clamp(6rem,22dvh,10rem)] object-contain" data-testid="sad-goose" />
                <p className="font-heading text-2xl font-black">{overlay.teamName ? `Ha indovinato ${overlay.teamName}` : "Turno concluso"}</p>
                <button
                  type="button"
                  data-testid="overlay-retry-button"
                  onClick={() => setOverlay(null)}
                  className="pointer-events-auto mt-4 rounded-full bg-amber-400 px-8 py-3 font-heading text-xl font-black text-amber-950 transition-transform duration-150 active:scale-95"
                >
                  RIPROVA
                </button>
              </>
            )}
            {overlay.kind === "wrong" && (
              <div className="mb-shake">
                <X className="mx-auto size-[clamp(6rem,22dvh,10rem)] text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" strokeWidth={4} />
                <p className="font-heading text-4xl font-black text-red-400">RISPOSTA ERRATA</p>
                <p className="mt-2 font-semibold text-white/80">Prenotazioni riaperte per tutte le squadre</p>
              </div>
            )}
            {overlay.kind === "skip" && (
              <p className="font-heading text-2xl font-black text-sky-300">LA SOLUZIONE ERA</p>
            )}
            {(overlay.kind === "win" || overlay.kind === "lose" || overlay.kind === "skip") && state?.mode === "guess" && track && <TrackReveal track={track} />}
            {(overlay.kind === "win" || overlay.kind === "lose") && state?.mode === "word" && word && (
              <p className="mt-4 font-heading text-3xl font-black tracking-wider text-sky-300">{word}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
