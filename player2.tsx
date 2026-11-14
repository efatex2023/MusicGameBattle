import { useCallback, useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2, UserX, Smartphone } from "lucide-react";
import { useRoomSocket } from "@/lib/socket";
import { getTeam, clearTeam } from "@/lib/identity";
import { MODE_LABEL } from "@/lib/types";
import type { RoomState } from "@/lib/types";
import { Shell, Panel, ConnBadge } from "@/components/game/Shell";
import { Buzzer } from "@/components/game/Buzzer";
import type { BuzzerMode } from "@/components/game/Buzzer";
import { Leaderboard } from "@/components/game/Leaderboard";
import { GameOverlays, TrackReveal } from "@/components/game/Overlays";
import { unlockAudio } from "@/lib/sfx";

function buzzerFor(s: RoomState): { mode: BuzzerMode; label: string; sub?: string } {
  const me = s.me;
  if (me?.status === "blocked") return { mode: "locked", label: "SQUADRA BLOCCATA", sub: "Il MASTER ha bloccato la squadra" };
  if (s.status === "lobby") return { mode: "waiting", label: "IN ATTESA CHE IL MASTER INIZI" };
  if (s.status === "countdown") return { mode: "locked", label: "PRONTI…" };
  if (s.paused || !s.master_online) return { mode: "locked", label: "GIOCO SOSPESO", sub: "Il MASTER si è disconnesso" };
  const t = s.turn;
  if (t.phase === "open") return { mode: "idle", label: "PRENOTATI" };
  if (t.phase === "buzzed") {
    return t.buzzed_team_id === me?.id
      ? { mode: "accepted", label: "PRENOTAZIONE ACCETTATA", sub: s.mode === "word" ? "Canta!" : "Dì il titolo!" }
      : { mode: "blocked", label: "PRENOTAZIONE BLOCCATA", sub: `Ha prenotato ${t.buzzed_team_name ?? ""}` };
  }
  if (t.phase === "done") return { mode: "locked", label: "TURNO CONCLUSO", sub: "Attendi il prossimo turno" };
  return { mode: "locked", label: "ATTENDI", sub: s.mode === "word" ? "Il MASTER prepara la parola" : "Il MASTER prepara il brano" };
}

export default function Player() {
  const { code = "" } = useParams();
  const CODE = code.toUpperCase();
  const team = getTeam(CODE);
  const { state, status, fatal, send, offset, rejectedAt } = useRoomSocket(CODE, "player", team?.token ?? null);
  const turnRef = useRef<number | null>(null);
  turnRef.current = state?.turn.n ?? null;
  // stable handler: send immediately (no render work before the network write), then unlock audio
  const onBuzz = useCallback(() => {
    if (turnRef.current === null) return false;
    const ok = send("buzz", { turn: turnRef.current });
    unlockAudio();
    return ok;
  }, [send]);
  useEffect(() => {
    const img = new Image();
    img.src = "/sad-goose.webp"; // warm the overlay image so the first "RIPROVA" shows instantly
  }, []);

  useEffect(() => {
    if (fatal === "invalid_token") clearTeam(CODE);
  }, [fatal, CODE]);

  if (!team || fatal === "invalid_token") return <Navigate to={`/join?code=${CODE}`} replace />;

  const header = (
    <>
      <span className="rounded-full bg-amber-400/15 px-3 py-1 font-mono text-xs font-black text-amber-300" data-testid="header-room-code">{CODE}</span>
      <ConnBadge status={status} />
    </>
  );

  if (fatal === "removed" || fatal === "replaced" || fatal === "not_found") {
    return (
      <Shell back="/" right={header}>
        <Panel className="text-center">
          {fatal === "removed" ? <UserX className="mx-auto size-14 text-red-400" /> : <Smartphone className="mx-auto size-14 text-sky-300" />}
          <p className="mt-3 font-heading text-2xl font-black" data-testid="player-fatal" data-reason={fatal}>
            {fatal === "removed" ? "SQUADRA RIMOSSA DAL MASTER" : fatal === "replaced" ? "SQUADRA ATTIVA SU UN ALTRO DISPOSITIVO" : "STANZA NON TROVATA"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {fatal === "removed" ? "Accesso revocato. Se il MASTER ti riammette, rientrerai automaticamente con nome e punteggio." : fatal === "replaced" ? "Un dispositivo può guidare la squadra alla volta." : ""}
          </p>
          {fatal === "replaced" && <button type="button" className="mt-4 font-bold text-sky-300 underline" onClick={() => window.location.reload()} data-testid="reclaim-button">Riprendi il controllo su questo dispositivo</button>}
        </Panel>
      </Shell>
    );
  }

  const b = state ? buzzerFor(state) : null;
  const showWord = state?.mode === "word" && state.turn.word;

  return (
    <Shell back="/" right={header}>
      <GameOverlays state={state} role="player" myTeamId={team.team_id} offset={offset} />
      {!state ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground" data-testid="player-loading"><Loader2 className="size-6 animate-spin" /> Connessione…</div>
      ) : (
        // one-screen layout: fixed info on top, buzzer takes all the free height, compact leaderboard at the bottom
        <div className="flex min-h-0 flex-1 flex-col items-stretch gap-[1.2dvh]">
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 px-3 py-[1dvh] sm:px-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground" data-testid="player-game-name">{MODE_LABEL[state.mode]}</p>
              <p className="flex items-center gap-2 font-heading text-[clamp(1rem,2.6dvh,1.25rem)] font-black">
                <span className="size-3.5 shrink-0 rounded-full" style={{ background: state.me?.color ?? team.color }} />
                <span className="truncate" data-testid="player-team-name">{state.me?.name ?? team.name}</span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Punti</p>
              <p className="font-mono text-[clamp(1.25rem,3.2dvh,1.5rem)] font-black leading-none" data-testid="player-score">{state.me?.score ?? 0}</p>
            </div>
          </div>

          {showWord && (
            <div className="mb-pop shrink-0 rounded-3xl bg-gradient-to-br from-purple-600/40 via-sky-500/25 to-red-500/25 px-4 py-[1.2dvh] text-center" key={state.turn.word}>
              <p className="text-[clamp(0.6rem,1.5dvh,0.75rem)] font-bold uppercase tracking-[0.3em] text-white/70">Canta una canzone con</p>
              <p className="break-words font-heading text-[clamp(1.75rem,min(11vw,6.5dvh),3rem)] font-black leading-tight tracking-wider" data-testid="player-word">{state.turn.word}</p>
            </div>
          )}
          {state.mode === "guess" && state.turn.phase === "done" && state.turn.track && (
            <div className="shrink-0 [&>div]:mt-0"><TrackReveal track={state.turn.track} /></div>
          )}

          {state.status === "ended" ? (
            <Panel className="shrink-0 text-center"><p className="font-heading text-3xl font-black" data-testid="player-ended">PARTITA CONCLUSA</p></Panel>
          ) : (
            b && (
              <div className="min-h-[7rem] flex-1">
                <Buzzer mode={b.mode} label={b.label} sub={b.sub} onPress={onBuzz} resetKey={`${state.seq}:${rejectedAt}`} />
              </div>
            )
          )}

          <Panel className={state.status === "ended" ? "flex min-h-0 flex-1 flex-col" : "flex max-h-[26dvh] min-h-0 shrink-0 flex-col"} title="Classifica">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><Leaderboard rows={state.leaderboard} highlightId={state.me?.id} compact /></div>
          </Panel>
          <p className="shrink-0 text-center text-[11px] leading-snug text-muted-foreground">
            Codice di recupero: <span className="font-mono font-black text-foreground" data-testid="player-recovery-code">{team.recovery_code}</span> · per rientrare da un altro dispositivo · <Link to="/" className="underline">Home</Link>
          </p>
        </div>
      )}
    </Shell>
  );
}
