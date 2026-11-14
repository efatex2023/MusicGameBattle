import { memo } from "react";
import { Trophy } from "lucide-react";
import type { BoardRow } from "@/lib/types";
import { cn, sameProps } from "@/lib/utils";

export const Leaderboard = memo(function Leaderboard({ rows, highlightId, compact = false, testid = "leaderboard" }: { rows: BoardRow[]; highlightId?: string | null; compact?: boolean; testid?: string }) {
  if (!rows.length) {
    return <p data-testid={`${testid}-empty`} className="py-4 text-center text-sm text-muted-foreground">Nessuna squadra in classifica.</p>;
  }
  const top = rows[0]?.score ?? 0;
  const cols = compact ? "grid-cols-[2.25rem_minmax(0,1fr)_2.5rem_3rem]" : "grid-cols-[3rem_minmax(0,1fr)_4rem_5rem]";
  return (
    <div data-testid={testid} className="overflow-hidden rounded-2xl border border-border">
      <div className={cn("grid bg-secondary/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground", cols)}>
        <span>Pos.</span><span>Squadra</span><span className="text-right">{compact ? "Pt" : "Punti"}</span><span className="text-right">{compact ? "Corr." : "Corrette"}</span>
      </div>
      {rows.map((r) => {
        const winner = r.position === 1 && top > 0;
        return (
          <div
            key={r.id}
            data-testid={`${testid}-row-${r.id}`}
            className={cn(
              "grid items-center border-t border-border px-3 transition-colors duration-300", cols,
              compact ? "py-[clamp(0.3rem,1dvh,0.5rem)]" : "py-3",
              winner && "bg-amber-400/10",
              highlightId === r.id && "ring-2 ring-inset ring-sky-400",
            )}
          >
            <span className="flex items-center gap-1 font-heading text-lg font-black">
              {winner ? <Trophy className="size-4 text-amber-400" /> : null}
              {r.position}
            </span>
            <span className="flex min-w-0 items-center gap-2 font-bold">
              <span className="size-3 shrink-0 rounded-full" style={{ background: r.color }} />
              <span className="truncate" data-testid={`${testid}-name-${r.id}`}>{r.name}</span>
            </span>
            <span className="text-right font-mono text-lg font-bold" data-testid={`${testid}-score-${r.id}`}>{r.score}</span>
            <span className="text-right font-mono text-sm text-muted-foreground">{r.correct}</span>
          </div>
        );
      })}
    </div>
  );
}, sameProps);
