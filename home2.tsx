import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, LogIn, History, Download } from "lucide-react";
import { Logo } from "@/components/game/Shell";
import { InstallDialog } from "@/components/game/InstallDialog";

const ITEMS = [
  { to: "/create", label: "CREA UNA PARTITA", sub: "Sei il MASTER: crea la stanza e scegli il gioco", icon: PlusCircle, cls: "from-red-500 to-orange-500 text-white", testid: "home-create-button" },
  { to: "/join", label: "PARTECIPA A UNA PARTITA", sub: "Entra con codice, QR o link", icon: LogIn, cls: "from-sky-400 to-cyan-300 text-sky-950", testid: "home-join-button" },
  { to: "/history", label: "STORICO PARTITE", sub: "Classifiche finali di tutte le partite", icon: History, cls: "from-purple-500 to-fuchsia-500 text-white", testid: "home-history-button" },
];

export default function Home() {
  const [install, setInstall] = useState(false);
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col overflow-hidden px-5 pb-[max(1.5dvh,env(safe-area-inset-bottom))] pt-[max(2dvh,env(safe-area-inset-top))]">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Logo />
        <button type="button" onClick={() => setInstall(true)} data-testid="home-install-button"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-400/40 bg-[#1E1B4B] px-3 py-2 text-[11px] font-black tracking-wider text-indigo-100 transition-colors duration-200 hover:bg-indigo-900 sm:px-4 sm:text-xs">
          <Download className="size-4" /> INSTALLA APP
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center py-[2dvh]">
        <div className="mb-eq mb-[1.5dvh] flex h-[clamp(1.25rem,5dvh,2.5rem)] items-end gap-1.5" aria-hidden>
          {["#EF4444", "#F59E0B", "#22C55E", "#38BDF8", "#A855F7", "#EC4899", "#F59E0B", "#EF4444"].map((c, i) => (
            <span key={i} className="h-full w-2.5 rounded-full" style={{ background: c, animationDelay: `${i * 0.11}s` }} />
          ))}
        </div>
        <h1 className="font-heading text-[clamp(2rem,min(12vw,7dvh),3.75rem)] font-black uppercase leading-[0.95] tracking-tight">
          Sfida <span className="mb-rainbow-text">a colpi</span> di musica.
        </h1>
        <p className="mt-[1.5dvh] max-w-md text-[clamp(0.8rem,2.1dvh,1rem)] font-medium text-muted-foreground">
          Due giochi, un buzzer: <b className="text-foreground">Indovina il brano</b> e <b className="text-foreground">Parola Battle</b>. Fino a 10 squadre, ognuna col suo smartphone.
        </p>
      </div>

      <nav className="flex shrink-0 flex-col gap-[1.6dvh]">
        {ITEMS.map((it, i) => (
          <div key={it.to} className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-300" style={{ animationDelay: `${80 * i}ms` }}>
            <Link to={it.to} data-testid={it.testid}
              className={`group flex items-center gap-4 rounded-3xl bg-gradient-to-r px-4 py-[clamp(0.6rem,2dvh,1.25rem)] shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-transform duration-150 active:scale-[0.98] hover:-translate-y-0.5 ${it.cls}`}>
              <span className="flex size-[clamp(2.5rem,7dvh,3.5rem)] shrink-0 items-center justify-center rounded-2xl bg-black/15"><it.icon className="size-[55%]" /></span>
              <span>
                <span className="block font-heading text-[clamp(1rem,min(5.5vw,3.2dvh),1.5rem)] font-black leading-tight tracking-tight">{it.label}</span>
                <span className="block text-[clamp(0.7rem,1.8dvh,0.875rem)] font-semibold leading-snug opacity-80">{it.sub}</span>
              </span>
            </Link>
          </div>
        ))}
      </nav>
      <InstallDialog open={install} onOpenChange={setInstall} />
    </div>
  );
}
