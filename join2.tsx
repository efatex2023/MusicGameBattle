import { lazy, Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, KeyRound, Users, Camera } from "lucide-react";
const QrScanner = lazy(() => import("@/components/game/QrScanner").then((m) => ({ default: m.QrScanner }))); // camera decoder loads only on demand
import { ApiError, apiPost } from "@/lib/api";
import type { JoinResponse } from "@/lib/types";
import { getTeam, saveTeam } from "@/lib/identity";
import { Shell, Panel, PageTitle } from "@/components/game/Shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { unlockAudio } from "@/lib/sfx";

const detail = (e: unknown) => {
  if (e instanceof ApiError) {
    const b = e.body as { detail?: unknown } | null;
    if (typeof b?.detail === "string") return b.detail;
    if (e.status === 404) return "Stanza non trovata";
  }
  return "Connessione non riuscita, riprova";
};

export default function Join() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [recovery, setRecovery] = useState("");
  const [tab, setTab] = useState("new");
  const [scanOpen, setScanOpen] = useState(false);
  const saved = code.length === 6 ? getTeam(code) : null;

  const onOk = (r: JoinResponse) => {
    saveTeam(code, r);
    nav(`/play/${code}`);
  };
  const join = useMutation({ mutationFn: () => apiPost<JoinResponse>(`/rooms/${code}/join`, { name: name.trim() }), onSuccess: onOk });
  const recover = useMutation({ mutationFn: () => apiPost<JoinResponse>(`/rooms/${code}/recover`, { recovery_code: recovery.trim() }), onSuccess: onOk });

  return (
    <Shell back="/">
      <PageTitle title="Partecipa" sub="Inserisci il codice della stanza o inquadra il QR del MASTER." />
      <Panel className="mt-[2dvh] shrink-0" title="Codice stanza">
        <div className="flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="ABC123"
            className="h-[clamp(3rem,8dvh,4rem)] min-w-0 flex-1 text-center font-mono text-[clamp(1.5rem,4.5dvh,1.875rem)] font-black tracking-[0.3em]" data-testid="join-code-input" inputMode="text" autoCapitalize="characters" />
          <button type="button" onClick={() => setScanOpen(true)} aria-label="Scansiona QR code" data-testid="scan-qr-button"
            className="flex size-[clamp(3rem,8dvh,4rem)] shrink-0 items-center justify-center rounded-xl bg-sky-400 text-sky-950 transition-transform duration-150 hover:bg-sky-300 active:scale-95">
            <Camera className="size-7" />
          </button>
        </div>
      </Panel>
      {scanOpen && <Suspense fallback={null}><QrScanner open={scanOpen} onOpenChange={setScanOpen} onCode={setCode} /></Suspense>}

      {saved && (
        <Button onClick={() => { unlockAudio(); nav(`/play/${code}`); }} data-testid="rejoin-saved-button" className="mt-[1.5dvh] h-[clamp(2.75rem,6.5dvh,3.5rem)] w-full shrink-0 rounded-2xl bg-emerald-500 text-lg font-black text-emerald-950 hover:bg-emerald-400">
          RIENTRA COME {saved.name.toUpperCase()}
        </Button>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="mt-[1.5dvh] shrink-0">
        <TabsList className="w-full">
          <TabsTrigger value="new" data-testid="join-tab-new"><Users className="size-4" /> Nuova squadra</TabsTrigger>
          <TabsTrigger value="recover" data-testid="join-tab-recover"><KeyRound className="size-4" /> Ho già una squadra</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          <Panel>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome squadra</label>
            <div className="relative mt-2">
              <Input value={name} maxLength={20} onChange={(e) => setName(e.target.value.slice(0, 20))} placeholder="es. I Rockettari" className="h-[clamp(2.75rem,6.5dvh,3.5rem)] pr-16 text-lg font-bold" data-testid="team-name-input" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground" data-testid="team-name-counter">{name.length}/20</span>
            </div>
            {join.isError && <p className="mt-2 text-sm font-semibold text-red-300" data-testid="join-error">{detail(join.error)}</p>}
            <Button onClick={() => { unlockAudio(); join.mutate(); }} disabled={code.length !== 6 || !name.trim() || join.isPending} data-testid="join-submit-button"
              className="mt-[1.5dvh] h-[clamp(2.75rem,6.5dvh,3.5rem)] w-full rounded-2xl bg-sky-400 font-heading text-xl font-black text-sky-950 hover:bg-sky-300">
              {join.isPending && <Loader2 className="size-5 animate-spin" />} ENTRA IN PARTITA
            </Button>
          </Panel>
        </TabsContent>
        <TabsContent value="recover">
          <Panel>
            <p className="text-[clamp(0.75rem,1.9dvh,0.875rem)] text-muted-foreground">Cambi dispositivo o hai perso la connessione? Inserisci il <b>codice di recupero</b> mostrato sul telefono della squadra. Il vecchio dispositivo verrà scollegato.</p>
            <Input value={recovery} onChange={(e) => setRecovery(e.target.value.toUpperCase())} maxLength={12} placeholder="XXXXXXXX" className="mt-[1.2dvh] h-[clamp(2.75rem,6.5dvh,3.5rem)] text-center font-mono text-2xl font-black tracking-[0.2em]" data-testid="recovery-code-input" />
            {recover.isError && <p className="mt-2 text-sm font-semibold text-red-300" data-testid="recover-error">{detail(recover.error)}</p>}
            <Button onClick={() => { unlockAudio(); recover.mutate(); }} disabled={code.length !== 6 || recovery.trim().length < 4 || recover.isPending} data-testid="recover-submit-button"
              className="mt-[1.5dvh] h-[clamp(2.75rem,6.5dvh,3.5rem)] w-full rounded-2xl bg-amber-400 font-heading text-xl font-black text-amber-950 hover:bg-amber-300">
              RECUPERA SQUADRA
            </Button>
          </Panel>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
