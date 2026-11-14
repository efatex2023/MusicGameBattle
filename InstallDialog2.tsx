import { useEffect, useState } from "react";
import { Download, Smartphone, Monitor, Apple } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: BIPEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
  });
}

const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function InstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCanPrompt(Boolean(deferred));
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="install-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-black">INSTALLA APP</DialogTitle>
          <DialogDescription>MUSIC BATTLE è una web app (PWA): si installa dal browser, senza store. Non esistono APK o IPA.</DialogDescription>
        </DialogHeader>
        {installed && <p className="rounded-xl bg-emerald-500/15 p-3 text-sm font-semibold text-emerald-300" data-testid="install-already">App già installata su questo dispositivo.</p>}
        {canPrompt && (
          <Button
            data-testid="install-now-button"
            className="h-12 text-base font-bold"
            onClick={async () => {
              await deferred?.prompt();
              deferred = null;
              setCanPrompt(false);
            }}
          >
            <Download className="size-5" /> INSTALLA ORA
          </Button>
        )}
        <Tabs defaultValue={isIOS() ? "ios" : "android"}>
          <TabsList className="w-full">
            <TabsTrigger value="android" data-testid="install-tab-android"><Smartphone className="size-4" /> Android</TabsTrigger>
            <TabsTrigger value="ios" data-testid="install-tab-ios"><Apple className="size-4" /> iPhone</TabsTrigger>
            <TabsTrigger value="desktop" data-testid="install-tab-desktop"><Monitor className="size-4" /> Computer</TabsTrigger>
          </TabsList>
          <TabsContent value="android" className="space-y-2 pt-2 text-sm leading-relaxed">
            <p>1. Apri questo sito con <b>Chrome</b> (Android 14+).</p>
            <p>2. Tocca il menu <b>⋮</b> in alto a destra.</p>
            <p>3. Scegli <b>Installa app</b> (o <b>Aggiungi a schermata Home</b>) e conferma.</p>
          </TabsContent>
          <TabsContent value="ios" className="space-y-2 pt-2 text-sm leading-relaxed">
            <p>1. Apri questo sito con <b>Safari</b> (iPhone 11+).</p>
            <p>2. Tocca <b>Condividi</b> (quadrato con freccia in su).</p>
            <p>3. Scorri e scegli <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>.</p>
            <p className="text-muted-foreground">Nota iOS: l'audio parte solo dopo un tocco; se blocchi lo schermo o cambi app la connessione si sospende e si ricollega automaticamente al ritorno.</p>
          </TabsContent>
          <TabsContent value="desktop" className="space-y-2 pt-2 text-sm leading-relaxed">
            <p>In Chrome o Edge clicca l'icona <b>Installa</b> nella barra degli indirizzi, oppure menu → <b>Installa MUSIC BATTLE</b>.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
