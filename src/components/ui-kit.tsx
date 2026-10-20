import { useState, type ReactNode } from "react";
import { Check, Copy, FlaskConical, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card p-5 shadow-card", className)}>{children}</div>;
}

export function Button({ variant = "primary", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border bg-card hover:bg-muted text-foreground",
    ghost: "hover:bg-muted text-muted-foreground",
  }[variant];
  return <button {...p} className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none", v, className)} />;
}

export const inputCls = "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button variant="outline" className="px-3 py-1.5" disabled={!text} onClick={async () => {
      await navigator.clipboard.writeText(text);
      setOk(true); setTimeout(() => setOk(false), 1500);
    }}>
      {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{ok ? "Copied" : "Copy"}
    </Button>
  );
}

export function SimulatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
      <FlaskConical className="h-3 w-3" /> Simulated response
    </span>
  );
}

export function Loading({ label = "Generating…" }: { label?: string }) {
  return <div className="flex items-center gap-2 py-10 justify-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>;
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-2xl bg-secondary p-3 text-primary">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function ResponsibleNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border bg-secondary/60 p-4 text-sm text-secondary-foreground">
      <ShieldAlert className="h-5 w-5 shrink-0 text-primary" />
      <p><strong>Responsible AI:</strong> outputs here are simulated in your browser. Always review and verify content before using it, and never enter confidential, personal, or client-sensitive information.</p>
    </div>
  );
}

export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-1 text-muted-foreground">{desc}</p>
    </div>
  );
}
