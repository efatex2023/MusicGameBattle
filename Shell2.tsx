import { Link } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ConnStatus } from "@/lib/socket";
import { cn } from "@/lib/utils";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap select-none" data-testid="app-logo">
      <img src="/logo-96.webp" alt="" width={44} height={44} decoding="async" className={cn("rounded-xl", small ? "size-8" : "size-[clamp(2rem,9vw,2.75rem)]")} />
      <span className={cn("font-heading font-black tracking-tight", small ? "hidden text-lg sm:inline" : "text-[clamp(1.05rem,5.2vw,1.5rem)]")}>
        MUSIC <span className={small ? "mb-rainbow-static" : "mb-rainbow-text"}>BATTLE</span>
      </span>
    </div>
  );
}

export function BackButton({ to, label = "INDIETRO" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      data-testid="back-button"
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-bold tracking-wide transition-colors duration-200 hover:bg-accent sm:px-4 sm:py-2 sm:text-sm"
    >
      <ArrowLeft className="size-4" /> {label}
    </Link>
  );
}

// Every page is exactly one screen tall (100dvh): header + a main area that fills the rest.
// Pages lay out with flex and fluid sizes; only long lists scroll inside their own box.
export function Shell({ back, right, children, wide = false }: { back?: string; right?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <header className="z-30 shrink-0 border-b border-border/60 bg-[#0B0F19]/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className={cn("mx-auto flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3", wide ? "max-w-7xl" : "max-w-3xl")}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {back && <BackButton to={back} />}
            <Link to="/" data-testid="header-home-link"><Logo small /></Link>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{right}</div>
        </div>
      </header>
      <main className={cn("mx-auto flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-5", wide ? "max-w-7xl" : "max-w-3xl")}>{children}</main>
    </div>
  );
}

/** Fluid page title: shrinks with screen height so forms fit without scrolling. */
export function PageTitle({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="shrink-0">
      <h1 className="font-heading text-[clamp(1.5rem,min(8vw,5dvh),2.25rem)] font-black uppercase leading-tight tracking-tight">{title}</h1>
      {sub && <p className="mt-0.5 text-[clamp(0.8rem,2dvh,1rem)] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function ConnBadge({ status }: { status: ConnStatus }) {
  const map = {
    online: { icon: <Wifi className="size-3.5" />, text: "CONNESSO", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    connecting: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "CONNESSIONE…", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    offline: { icon: <WifiOff className="size-3.5" />, text: "OFFLINE", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
  }[status];
  return (
    <span data-testid="connection-status" data-status={status} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider", map.cls)}>
      {map.icon} {map.text}
    </span>
  );
}

export function Panel({ title, children, className, action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card/80 p-3 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]", className)}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
          {title && <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
