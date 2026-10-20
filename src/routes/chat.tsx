import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, RotateCcw, Send } from "lucide-react";
import { Button, Card, CopyButton, Empty, PageHeader, ResponsibleNotice, SimulatedBadge, inputCls } from "@/components/ui-kit";
import { chatReply, delay } from "@/lib/mock-ai";
import { useSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — WorkPilot AI" },
      { name: "description", content: "A workplace assistant for drafting, brainstorming, summarising and planning." },
      { property: "og:title", content: "AI Chatbot — WorkPilot AI" },
      { property: "og:description", content: "Chat through everyday work tasks with a simulated assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const starters = ["Brainstorm ideas for improving team onboarding", "Draft a message announcing a new project kickoff", "Create a meeting agenda for a quarterly review", "I'm overwhelmed with deadlines — help me prioritise"];

function ChatPage() {
  const [msgs, setMsgs] = useSession<Msg[]>("wp-chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const generation = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "auto", block: "nearest" }); }, [msgs, loading]);
  useEffect(() => () => { generation.current += 1; }, []);

  function reset() {
    generation.current += 1;
    pending.current = false;
    setMsgs([]); setInput(""); setError(""); setLoading(false);
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || pending.current) return;
    pending.current = true;
    const request = generation.current;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next); setInput(""); setLoading(true); setError("");
    try {
      await delay();
      if (request !== generation.current) return;
      setMsgs([...next, { role: "assistant", content: chatReply(t, next) }]);
    } catch {
      if (request === generation.current) { setError("The reply could not be prepared. Please try again."); setInput(t); }
    } finally {
      if (request === generation.current) { pending.current = false; setLoading(false); }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="AI Chatbot" desc="Your workplace assistant. History is kept for this browser session." />
        {msgs.length > 0 && <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" />New chat</Button>}
      </div>
      <Card className="flex h-[60vh] min-h-96 flex-col p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {msgs.length === 0 && !loading ? (
            <div>
              <Empty icon={<MessageSquare className="h-6 w-6" />} title="Start a conversation" text="Ask for help drafting, brainstorming, summarising or planning." />
              <div className="grid gap-2 sm:grid-cols-2">
                {starters.map((s) => <Button variant="outline" key={s} onClick={() => send(s)} className="justify-start whitespace-normal p-3 text-left font-normal">{s}</Button>)}
              </div>
            </div>
          ) : msgs.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "assistant" && <div className="h-8 w-8 shrink-0 rounded-full bg-secondary p-1.5 text-primary"><Bot className="h-5 w-5" /></div>}
               <div className={cn("max-w-[85%] break-words rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {m.content.replace(/\*\*/g, "")}
                {m.role === "assistant" && <div className="mt-3 flex items-center gap-2"><SimulatedBadge /><CopyButton text={m.content.replace(/\*\*/g, "")} /></div>}
              </div>
            </div>
          ))}
          {loading && <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Assistant is typing…</div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
          <input aria-label="Chat message" className={cn(inputCls, "min-w-0")} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your work… (try “Summarise: …”)" />
          <Button type="submit" disabled={loading || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
        </form>
      </Card>
      <ResponsibleNotice />
    </div>
  );
}
