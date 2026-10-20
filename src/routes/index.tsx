import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Search, MessageSquare, ArrowRight } from "lucide-react";
import { Card, ResponsibleNotice } from "@/components/ui-kit";
import { useLocal } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkPilot AI Productivity Assistant" },
      { name: "description", content: "Draft emails, research topics and chat with a workplace assistant — a browser-based AI productivity prototype." },
      { property: "og:title", content: "WorkPilot AI — Workplace Productivity Assistant" },
      { property: "og:description", content: "Smart emails, research summaries and a workplace chatbot in one dashboard." },
    ],
  }),
  component: Index,
});

const tools = [
  { to: "/email", icon: Mail, title: "Smart Email Generator", desc: "Turn quick instructions into polished Formal, Friendly or Persuasive emails." },
  { to: "/research", icon: Search, title: "AI Research Assistant", desc: "Summaries, key insights and recommendations from topics, articles or URLs." },
  { to: "/chat", icon: MessageSquare, title: "AI Chatbot", desc: "Draft, brainstorm, summarise and solve everyday work tasks." },
] as const;

function Index() {
  const [emails] = useLocal<unknown[]>("wp-email-history", []);
  const [research] = useLocal<unknown[]>("wp-research-history", []);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-hero p-6 text-navy-foreground md:p-8">
        <p className="text-sm font-medium opacity-80">Welcome back 👋</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">Your AI Workplace Productivity Assistant</h1>
        <p className="mt-2 max-w-xl opacity-80">Get work done faster with smart drafting, research and chat tools. This prototype uses simulated, browser-based responses.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Emails generated", emails.length], ["Research reports", research.length], ["Tools available", 3]].map(([l, n]) => (
          <Card key={l as string}><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-3xl font-bold text-primary">{n}</p></Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="group">
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-primary/40">
              <div className="mb-4 inline-flex rounded-xl bg-secondary p-2.5 text-primary"><t.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Open <ArrowRight className="h-4 w-4" /></span>
            </Card>
          </Link>
        ))}
      </div>
      <ResponsibleNotice />
    </div>
  );
}
