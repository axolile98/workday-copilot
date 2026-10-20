import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Mail, Search, MessageSquare, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/research", label: "Research Assistant", icon: Search },
  { to: "/chat", label: "AI Chatbot", icon: MessageSquare },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const side = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="rounded-xl bg-primary p-2 text-primary-foreground"><Sparkles className="h-5 w-5" /></div>
        <div className="leading-tight"><p className="font-bold">WorkPilot AI</p><p className="text-xs opacity-70">Productivity Assistant</p></div>
      </div>
      {nav.map((n) => (
        <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
          className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            path === n.to ? "bg-primary text-primary-foreground" : "opacity-80 hover:bg-navy-foreground/10 hover:opacity-100")}>
          <n.icon className="h-4 w-4" />{n.label}
        </Link>
      ))}
      <p className="mt-auto rounded-xl bg-navy-foreground/10 p-3 text-xs opacity-80">Prototype mode — all AI responses are simulated locally. No API connected.</p>
    </nav>
  );
  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-navy text-navy-foreground md:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy text-navy-foreground">
            <button className="absolute right-3 top-4" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            {side}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-bold">WorkPilot AI</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
