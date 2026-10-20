import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Search, Trash2 } from "lucide-react";
import { Button, Card, CopyButton, Empty, Loading, PageHeader, ResponsibleNotice, SimulatedBadge, inputCls } from "@/components/ui-kit";
import { delay, research, type ResearchResult } from "@/lib/mock-ai";
import { useLocal } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — WorkPilot AI" },
      { name: "description", content: "Summaries, key insights and actionable recommendations from topics, articles or URLs." },
      { property: "og:title", content: "AI Research Assistant — WorkPilot AI" },
      { property: "og:description", content: "Turn topics and articles into insights and next steps." },
    ],
  }),
  component: ResearchPage,
});

type Mode = "topic" | "article" | "url";
const modes: { id: Mode; label: string; ph: string }[] = [
  { id: "topic", label: "Topic", ph: "e.g. Hybrid work policies for small teams" },
  { id: "article", label: "Paste article", ph: "Paste the full article or report text here…" },
  { id: "url", label: "Website URL", ph: "https://example.com/article" },
];

function toText(r: ResearchResult) {
  return `${r.source}\n${r.urlNotice ? `\nNOTE: ${r.urlNotice}\n` : ""}\nSUMMARY\n${r.summary}\n\nKEY INSIGHTS\n${r.insights.map((i) => `- ${i}`).join("\n")}\n\nRECOMMENDATIONS\n${r.recommendations.map((i) => `- ${i}`).join("\n")}`;
}

function ResearchPage() {
  const [mode, setMode] = useLocal<Mode>("wp-pref-research-mode", "topic");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useLocal<ResearchResult[]>("wp-research-history", []);
  const m = modes.find((x) => x.id === mode)!;
  const urlInvalid = mode === "url" && value.trim() !== "" && !/^https?:\/\/\S+\.\S+/.test(value.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || urlInvalid) return;
    setLoading(true); setResult(null);
    await delay(1200);
    const r = research({ mode, value });
    setResult(r); setNotes(toText(r)); setLoading(false);
    setHistory((h) => [r, ...h].slice(0, 8));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="AI Research Assistant" desc="Get summaries, key insights and actionable recommendations." />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="inline-flex rounded-xl bg-muted p-1">
            {modes.map((x) => (
              <button type="button" key={x.id} onClick={() => setMode(x.id)}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", mode === x.id ? "bg-card text-primary shadow-card" : "text-muted-foreground")}>{x.label}</button>
            ))}
          </div>
          {mode === "article" ? (
            <textarea rows={7} className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder={m.ph} />
          ) : (
            <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder={m.ph} />
          )}
          {urlInvalid && <p className="text-sm text-destructive">Enter a full URL starting with http:// or https://</p>}
          <Button type="submit" disabled={loading || !value.trim() || urlInvalid}><Search className="h-4 w-4" />Analyse</Button>
        </form>
      </Card>

      <Card>
        {loading ? <Loading label="Analysing content…" /> : result ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><h2 className="font-semibold">{result.source}</h2><SimulatedBadge /></div>
              <CopyButton text={notes} />
            </div>
            {result.urlNotice && (
              <div className="flex gap-3 rounded-xl bg-warning p-3 text-sm text-warning-foreground"><AlertTriangle className="h-5 w-5 shrink-0" /><p>{result.urlNotice}</p></div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <Section title="Summary"><p>{result.summary}</p></Section>
              <Section title="Key insights"><ul className="list-disc space-y-1.5 pl-4">{result.insights.map((i) => <li key={i}>{i}</li>)}</ul></Section>
              <Section title="Recommendations"><ul className="list-disc space-y-1.5 pl-4">{result.recommendations.map((i) => <li key={i}>{i}</li>)}</ul></Section>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Editable report</label>
              <textarea rows={10} className={cn(inputCls, "font-mono text-[13px]")} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        ) : <Empty icon={<Search className="h-6 w-6" />} title="No research yet" text="Enter a topic, paste an article, or add a URL to get started." />}
      </Card>

      {history.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Research history</h2>
            <Button variant="ghost" onClick={() => setHistory([])}><Trash2 className="h-4 w-4" />Clear</Button></div>
          <ul className="divide-y">{history.map((h, i) => (
            <li key={i}><button className="w-full truncate py-2.5 text-left text-sm hover:text-primary" onClick={() => { setResult(h); setNotes(toText(h)); }}>{h.source}</button></li>
          ))}</ul>
        </Card>
      )}
      <ResponsibleNotice />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl bg-muted/60 p-4 text-sm"><h3 className="mb-2 font-semibold text-primary">{title}</h3>{children}</div>;
}
