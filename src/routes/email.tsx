import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Trash2, Wand2 } from "lucide-react";
import { Button, Card, CopyButton, Empty, Loading, PageHeader, ResponsibleNotice, SimulatedBadge, inputCls } from "@/components/ui-kit";
import { delay, generateEmail, type Tone } from "@/lib/mock-ai";
import { useLocal } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkPilot AI" },
      { name: "description", content: "Generate professional emails in Formal, Friendly or Persuasive tones, then edit and copy." },
      { property: "og:title", content: "Smart Email Generator — WorkPilot AI" },
      { property: "og:description", content: "Turn quick instructions into polished workplace emails." },
    ],
  }),
  component: EmailPage,
});

const tones: Tone[] = ["Formal", "Friendly", "Persuasive"];
type Item = { id: number; tone: Tone; text: string };

function EmailPage() {
  const [tone, setTone] = useLocal<Tone>("wp-pref-tone", "Formal");
  const [sender, setSender] = useLocal("wp-pref-sender", "");
  const [instructions, setInstructions] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useLocal<Item[]>("wp-email-history", []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!instructions.trim()) return;
    setLoading(true); setOutput("");
    await delay();
    const text = generateEmail({ instructions, recipient, subject, tone, sender });
    setOutput(text); setLoading(false);
    setHistory((h) => [{ id: Date.now(), tone, text }, ...h].slice(0, 10));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Smart Email Generator" desc="Describe what you need — get a structured, ready-to-edit email." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">What should the email say? *</label>
              <textarea required rows={5} className={inputCls} value={instructions} onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Ask the finance team to approve the Q3 marketing budget by Friday" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium">Recipient</label><input className={inputCls} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Sarah" /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Your name</label><input className={inputCls} value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Saved locally" /></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium">Subject (optional)</label><input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Auto-generated if empty" /></div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((t) => (
                  <button type="button" key={t} onClick={() => setTone(t)}
                    className={cn("rounded-xl border px-3 py-2 text-sm font-medium transition", tone === t ? "border-primary bg-secondary text-primary" : "hover:bg-muted")}>{t}</button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !instructions.trim()}><Wand2 className="h-4 w-4" />Generate email</Button>
          </form>
        </Card>
        <Card className="flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><h2 className="font-semibold">Output</h2>{output && <SimulatedBadge />}</div>
            <CopyButton text={output} />
          </div>
          {loading ? <Loading label="Drafting your email…" /> : output ? (
            <textarea className={cn(inputCls, "min-h-80 flex-1 font-mono text-[13px] leading-relaxed")} value={output} onChange={(e) => setOutput(e.target.value)} />
          ) : <Empty icon={<Mail className="h-6 w-6" />} title="No email yet" text="Fill in the instructions and pick a tone to generate an editable draft." />}
        </Card>
      </div>
      {history.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent drafts</h2>
            <Button variant="ghost" onClick={() => setHistory([])}><Trash2 className="h-4 w-4" />Clear</Button></div>
          <ul className="divide-y">
            {history.map((h) => (
              <li key={h.id}><button className="w-full py-2.5 text-left text-sm hover:text-primary" onClick={() => setOutput(h.text)}>
                <span className="mr-2 rounded-full bg-secondary px-2 py-0.5 text-xs">{h.tone}</span>{h.text.split("\n")[0].replace("Subject: ", "")}
              </button></li>
            ))}
          </ul>
        </Card>
      )}
      <ResponsibleNotice />
    </div>
  );
}
