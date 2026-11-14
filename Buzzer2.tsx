import { memo, useEffect, useRef, useState } from "react";
import { Lock, Check, Hourglass, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BuzzerMode = "idle" | "accepted" | "blocked" | "waiting" | "locked";
type Visual = BuzzerMode | "pending";

const DOME: Record<Visual, string> = {
  pending: "bg-gradient-to-b from-red-600 via-red-700 to-red-900 translate-y-3 shadow-[0_2px_0_#991b1b,0_10px_20px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(0,0,0,0.5)] cursor-wait",
  idle: "bg-gradient-to-b from-red-500 via-red-600 to-red-800 shadow-[0_12px_0_#991b1b,0_20px_30px_rgba(239,68,68,0.5),inset_0_4px_6px_rgba(255,255,255,0.4),inset_0_-8px_16px_rgba(0,0,0,0.4)] active:translate-y-3 active:shadow-[0_2px_0_#991b1b,0_10px_20px_rgba(239,68,68,0.7),inset_0_2px_4px_rgba(0,0,0,0.5)] hover:brightness-110 cursor-pointer",
  accepted: "bg-gradient-to-b from-green-400 via-green-600 to-green-800 shadow-[0_6px_0_#15803d,0_20px_40px_rgba(34,197,94,0.5),inset_0_4px_6px_rgba(255,255,255,0.4)] translate-y-1.5",
  blocked: "bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800 shadow-[0_6px_0_#1e293b,inset_0_4px_6px_rgba(255,255,255,0.15)] translate-y-1.5 text-slate-300 cursor-not-allowed",
  locked: "bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800 shadow-[0_8px_0_#1e293b,inset_0_4px_6px_rgba(255,255,255,0.15)] text-slate-300 cursor-not-allowed",
  waiting: "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 shadow-[0_8px_0_#92400e,inset_0_4px_6px_rgba(255,255,255,0.35)] text-amber-950 cursor-default",
};

const PENDING_TIMEOUT_MS = 3000;

// `resetKey` changes whenever the server answers (new snapshot seq or a rejection): that ends the
// local "request in flight" state. The press itself is handled on pointerdown, sends first, then paints.
export const Buzzer = memo(function Buzzer({ mode, label, sub, onPress, resetKey }: { mode: BuzzerMode; label: string; sub?: string; onPress?: () => boolean; resetKey?: string }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const pending = mode === "idle" && pendingKey !== null && pendingKey === resetKey;
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => { setPendingKey(null); setSlow(true); }, PENDING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [pending]);
  const visual: Visual = pending ? "pending" : mode;
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (btnRef.current) delete btnRef.current.dataset.pressing;
  }, [visual, resetKey]);
  const enabled = mode === "idle" && !pending;
  const shownLabel = pending ? "INVIO…" : label;
  const shownSub = pending ? "Richiesta al server" : slow && mode === "idle" ? "Connessione lenta: tocca di nuovo" : sub;
  return (
    // sized by its parent container (container-type: size): the buzzer always fits the free screen area
    <div className="flex size-full items-center justify-center" style={{ containerType: "size" }}>
      <div className="rounded-full bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 p-[4cqmin] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)]">
        <div className="rounded-full bg-slate-950 p-[2cqmin] shadow-[inset_0_10px_20px_rgba(0,0,0,0.9)]">
          <button
            ref={btnRef}
            type="button"
            data-testid="buzzer-button"
            data-mode={visual}
            disabled={!enabled}
            onPointerDown={(e) => {
              if (!enabled) return;
              e.preventDefault();
              e.currentTarget.dataset.pressing = "1"; // CSS-only pressed look, painted before React re-renders
              if (onPress?.()) {
                setSlow(false);
                setPendingKey(resetKey ?? "");
              }
            }}
            className={cn(
              "relative flex size-[min(80cqmin,22rem)] select-none flex-col items-center justify-center rounded-full px-[6cqmin] text-center font-heading font-black text-white transition-[transform,box-shadow,filter] duration-100 ease-out touch-manipulation",
              DOME[visual],
              visual === "idle" && "mb-glow",
              visual === "accepted" && "mb-glow-green",
            )}
          >
            <span className="pointer-events-none absolute left-1/2 top-[5%] h-1/3 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
            {visual === "pending" && <Loader2 className="mb-1 size-[12cqmin] max-h-12 max-w-12 animate-spin" strokeWidth={2.5} />}
            {mode === "accepted" && <Check className="mb-1 size-[13cqmin] max-h-12 max-w-12" strokeWidth={3} />}
            {(mode === "blocked" || mode === "locked") && <Lock className="mb-1 size-[11cqmin] max-h-10 max-w-10" strokeWidth={2.5} />}
            {mode === "waiting" && <Hourglass className="mb-1 size-[11cqmin] max-h-10 max-w-10 animate-pulse" strokeWidth={2.5} />}
            <span data-testid="buzzer-label" className="text-[clamp(0.95rem,7.5cqmin,1.9rem)] leading-tight tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{shownLabel}</span>
            {shownSub && <span className="mt-[1.5cqmin] text-[clamp(0.6rem,3.6cqmin,0.875rem)] font-bold uppercase tracking-wider opacity-90">{shownSub}</span>}
          </button>
        </div>
      </div>
    </div>
  );
});
