import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Music2, Type, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import type { Mode, RoomCreated } from "@/lib/types";
import { saveMaster } from "@/lib/identity";
import { Shell, Panel, PageTitle } from "@/components/game/Shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { unlockAudio } from "@/lib/sfx";

export const MODES: { mode: Mode; label: string; desc: string; icon: typeof Music2; cls: string }[] = [
  { mode: "guess", label: "INDOVINA IL BRANO", desc: "Fai ascoltare un estratto: chi si prenota per primo dice il titolo.", icon: Music2, cls: "from-red-500/30 to-orange-500/20 border-red-400" },
  { mode: "word", label: "PAROLA BATTLE", desc: "Esce una parola da un testo vero: canta una canzone che la contiene!", icon: Type, cls: "from-purple-500/30 to-sky-500/20 border-purple-400" },
];

export default function Create() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("guess");
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: () => apiPost<RoomCreated>("/rooms", { mode, name: name.trim() || null }),
    onSuccess: (r) => {
      saveMaster(r.code, r.master_token);
      nav(`/master/${r.code}`);
    },
    onError: () => toast.error("Impossibile creare la stanza. Riprova."),
  });
  return (
    <Shell back="/">
      <PageTitle title="Crea una partita" sub="Sarai il MASTER: questo dispositivo controlla il gioco." />
      <div className="mt-[2dvh] grid min-h-0 flex-1 grid-cols-2 gap-3">
        {MODES.map((m) => (
          <button key={m.mode} type="button" onClick={() => setMode(m.mode)} data-testid={`mode-option-${m.mode}`} data-selected={mode === m.mode}
            className={cn("flex min-h-0 flex-col justify-center rounded-3xl border-2 bg-gradient-to-br p-[clamp(0.75rem,2.5dvh,1.25rem)] text-left transition-[transform,border-color,opacity] duration-150 active:scale-[0.98]", m.cls, mode === m.mode ? "opacity-100" : "border-transparent opacity-60 hover:opacity-90")}>
            <m.icon className="size-[clamp(1.75rem,5dvh,2.25rem)] shrink-0" />
            <p className="mt-[1dvh] font-heading text-[clamp(1.05rem,min(5.5vw,3.4dvh),1.5rem)] font-black leading-tight">{m.label}</p>
            <p className="mt-1 text-[clamp(0.7rem,1.8dvh,0.875rem)] leading-snug text-white/80">{m.desc}</p>
          </button>
        ))}
      </div>
      <Panel className="mt-[2dvh] shrink-0" title="Nome partita (facoltativo)">
        <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="es. Serata da Marco" className="h-11" data-testid="match-name-input" />
        <p className="mt-1.5 text-xs text-muted-foreground">Se lasci vuoto, lo storico userà modalità, data e ora.</p>
      </Panel>
      <Button onClick={() => { unlockAudio(); create.mutate(); }} disabled={create.isPending} data-testid="create-room-button"
        className="mt-[2dvh] h-[clamp(3rem,7dvh,3.5rem)] w-full shrink-0 rounded-2xl bg-red-500 font-heading text-xl font-black text-white hover:bg-red-400">
        {create.isPending ? <Loader2 className="size-6 animate-spin" /> : null} CREA STANZA
      </Button>
    </Shell>
  );
}
