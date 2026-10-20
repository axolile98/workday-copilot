// Deterministic, browser-only drafting helpers. No model or web search is called.
export const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export type Tone = "Formal" | "Friendly" | "Persuasive";

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function sentences(text: string) {
  return text.trim().split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}
function cleanRequest(text: string) {
  return text.trim().replace(/^(?:please\s+)?(?:write|draft|compose|generate|create|send)\s+(?:me\s+)?(?:an?\s+)?(?:(?:formal|friendly|persuasive|professional)\s+)?(?:email|message|memo)\s*/i, "").replace(/^(?:that\s+)?(?:says?\s+|saying\s+|about\s+)/i, "").replace(/[.!?]+$/, "");
}
function emailBody(instructions: string, tone: Tone) {
  let text = cleanRequest(instructions);
  // Convert common instructions into a request to the recipient, without adding facts.
  text = text.replace(/^(?:to\s+)?ask\s+(?:.+?\s+)?to\s+(.+)$/i, (_, action: string) =>
    `${tone === "Formal" ? "Could you please" : tone === "Friendly" ? "Could you" : "Please"} ${action}`);
  text = text.replace(/^(?:to\s+)?(?:tell|inform|notify|let)\s+.+?\s+(?:that|know that|know)\s+/i, "");
  text = text.replace(/^to\s+(?=(?:request|confirm|thank|apologise|apologize|follow up|invite)\b)/i, "");
  text = text.replace(/^request\s+/i, "I would like to request ")
    .replace(/^confirm\s+/i, "I am writing to confirm ")
    .replace(/^thank\s+(?:.+?\s+)?for\s+/i, "Thank you for ")
    .replace(/^apologi[sz]e\s+(?:to\s+.+?\s+)?for\s+/i, "I apologise for ")
    .replace(/^follow up on\s+/i, "I am following up on ");
  if (/^(?:Could|Would) you\b/i.test(text)) return `${cap(text)}?`;
  return `${cap(text)}.`;
}
export function generateEmail(input: { instructions: string; recipient: string; subject: string; tone: Tone; sender: string }) {
  const { tone } = input;
  const topic = cleanRequest(input.instructions);
  const subject = input.subject.trim() || cap(topic.split(/\n/)[0].split(/\s+/).slice(0, 10).join(" "));
  const recipient = input.recipient.trim() || "[Recipient]";
  const sender = input.sender.trim() || "[Your name]";
  const greet = { Formal: `Dear ${recipient},`, Friendly: `Hi ${recipient},`, Persuasive: `Hello ${recipient},` }[tone];
  const close = { Formal: "Kind regards,", Friendly: "Best,", Persuasive: "Thank you," }[tone];
  const opening = tone === "Friendly" ? "I hope you’re well.\n\n" : "";
  return `Subject: ${subject}\n\n${greet}\n\n${opening}${emailBody(input.instructions, tone)}\n\n${close}\n${sender}`;
}

export type ResearchResult = { source: string; urlNotice?: string; summary: string; insights: string[]; recommendations: string[] };
const STOP = new Set("the a an and or of to in on for with is are was were be by that this it as at from have has will can we our your their they you i not but if more most into about would could should also than then been which when where what".split(" "));
function keywords(text: string, n = 5) {
  const freq: Record<string, number> = {};
  for (const w of text.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? []) if (!STOP.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  return Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0,n).map(([w]) => w);
}
function selectedSentences(text: string, count = 3) {
  const all = sentences(text);
  const kw = keywords(text, 8);
  const ranked = all.map((s, index) => ({ s, index, score: kw.reduce((n,w) => n + (s.toLowerCase().includes(w) ? 1 : 0), 0) + (/\d/.test(s) ? 2 : 0) }));
  return ranked.sort((a,b) => b.score - a.score || a.index - b.index).slice(0,count).sort((a,b) => a.index - b.index).map(x => x.s);
}
export function research(input: { mode: "topic" | "article" | "url"; value: string }): ResearchResult {
  const v = input.value.trim();
  if (input.mode === "url") {
    return { source: v, urlNotice: "This offline prototype cannot read websites. No page content has been analysed. Paste the article text for a grounded summary.", summary: "No summary available: the article content was not provided.", insights: [], recommendations: ["Paste the article text into the Paste article tab."] };
  }
  if (input.mode === "article") {
    const all = sentences(v);
    const chosen = selectedSentences(v);
    const data = all.filter(s => /\d|\b(?:found|reported|concluded|because|however|risk|result)\b/i.test(s));
    const insights = [...new Set([...data, ...chosen])].slice(0,4);
    return { source: `Pasted article (${v.split(/\s+/).length} words)`, summary: chosen.join(" "), insights,
      recommendations: ["Verify the claims quoted above against the original source, author and publication date.", ...(data.length ? ["Check the scope and supporting evidence for the findings quoted in Key insights before acting on them."] : [])] };
  }
  // Topic-only input provides no source material. Return a brief, not fabricated research.
  return { source: `Topic: ${v}`, urlNotice: "No sources were supplied and no web search was performed. This is a research brief, not findings.", summary: `Research question: ${v}`, insights: [], recommendations: [
    `Find a primary source addressing “${v}” and note its author, date and evidence.`,
    `Compare an independent source on “${v}” and record where the evidence agrees or differs.`,
    "Paste the source text into Paste article to extract a summary and key statements.",
  ] };
}

export function chatReply(msg: string, history: { role: string; content: string }[]): string {
  const t = msg.trim();
  const m = t.toLowerCase();
  const previous = history.slice(0,-1).filter(h => h.role === "user").at(-1)?.content;
  const lastReply = history.filter(h => h.role === "assistant").at(-1)?.content;
  if (/^(?:hi|hello|hey|good morning|good afternoon)[!.\s]*$/i.test(t)) return "Hello! What are you working on today?";
  if (/^(?:thanks|thank you)[!.\s]*$/i.test(t)) return "You’re welcome!";
  if (/\b(?:shorter|shorten|more concise|condense)\b/.test(m) && lastReply) {
    if (lastReply.startsWith("Subject:")) {
      const lines = lastReply.split("\n\n");
      return lines.filter((s,i) => i === 0 || !s.startsWith("I hope")).map((s,i) => i > 1 && i < lines.length-2 ? selectedSentences(s,1).join(" ") : s).join("\n\n");
    }
    return selectedSentences(lastReply,2).join("\n");
  }
  if (/\b(?:formal|friendly|persuasive)\b/.test(m) && /\b(?:make|change|rewrite|tone)\b/.test(m) && previous && lastReply?.startsWith("Subject:")) {
    const tone: Tone = /friendly/.test(m) ? "Friendly" : /persuasive/.test(m) ? "Persuasive" : "Formal";
    const original = history.filter(h => h.role === "user" && /\b(?:email|draft|write|memo|message)\b/i.test(h.content)).at(-1)?.content ?? previous;
    return generateEmail({ instructions: original, recipient: "", sender: "", subject: "", tone });
  }
  if (/summari[sz]e|summary|tl;?dr/.test(m)) {
    const text = t.replace(/^.*?(?:summari[sz]e|summary|tl;?dr)\s*(?:this\s*)?[:\-]?\s*/i, "");
    const content = text || previous || "";
    if (!content || /^(?:this|it|that)$/i.test(content)) return "Please paste the text you want summarised. I can extract its main statements without adding facts.";
    return `Summary (from the supplied text):\n${selectedSentences(content).map(s => `• ${s}`).join("\n")}`;
  }
  if (/\b(?:draft|write|email|message|memo)\b/.test(m)) {
    return generateEmail({ instructions: t, recipient: "", sender: "", subject: "", tone: /friendly/.test(m) ? "Friendly" : /persuasive/.test(m) ? "Persuasive" : "Formal" });
  }
  if (/meeting|agenda/.test(m)) {
    const topic = t.replace(/^(?:please\s+)?(?:create|write|draft|prepare)\s+(?:an?\s+)?(?:meeting\s+)?agenda\s*(?:for|about|on)?\s*/i, "");
    return `Agenda: ${topic}\n1. Confirm the purpose and decisions needed for ${topic}.\n2. Review relevant updates and evidence.\n3. Discuss open questions and options.\n4. Agree decisions, action owners and due dates.`;
  }
  if (/brainstorm|\bideas?\b/.test(m)) {
    const topic = t.replace(/^.*?(?:brainstorm|ideas?)\s*(?:ideas?\s*)?(?:for|on|about)?\s*/i, "").replace(/[?.]$/, "");
    if (!topic) return "What topic would you like ideas for?";
    if (/onboarding/.test(topic)) return `Ideas for ${topic}:\n• Assign a buddy for questions during the first week.\n• Prepare access, equipment and a first-day checklist before arrival.\n• Set role-specific milestones for the first month.\n• Gather feedback after week one and update the checklist.`;
    return `Ideas to explore for ${topic}:\n• Ask the people affected which part of ${topic} creates the most friction.\n• Test a small version of your proposed change before a wider rollout.\n• Compare two approaches using the same success measure.\n\nThese are brainstorming prompts, not researched findings. What constraints or audience should we focus on?`;
  }
  if (/priorit|overwhelm|deadline/.test(m)) return `Let’s prioritise your workload.\n${t.includes(":") ? `Tasks you supplied: ${t.split(":").slice(1).join(":").trim()}\n` : ""}List each task with its due date, estimated effort and impact. I don’t have enough detail to rank them yet. Which deadline is nearest, and which task blocks someone else?`;
  if (/research|\bwhat is\b|\bexplain\b|\bwho\b|\bwhy\b/.test(m)) return `I can’t reliably answer “${t}” from a live source in this offline prototype. Paste relevant source text and I can summarise it without inventing facts.`;
  return `I’ve received your message: “${t}”\n\nThis is an offline drafting helper, not a connected AI model. What result do you need: an email draft, a summary of supplied text, ideas or an agenda?${previous ? `\nYour previous request was: “${previous}”` : ""}`;
}
