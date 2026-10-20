// Browser-only simulated AI. No real model is called.
export const delay = (ms = 900) => new Promise((r) => setTimeout(r, ms + Math.random() * 500));

export type Tone = "Formal" | "Friendly" | "Persuasive";

function firstSentence(t: string) {
  return t.trim().split(/(?<=[.!?])\s+/)[0] ?? t;
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateEmail(input: { instructions: string; recipient: string; subject: string; tone: Tone; sender: string }) {
  const { instructions, tone } = input;
  const recipient = input.recipient.trim() || "there";
  const sender = input.sender.trim() || "[Your name]";
  const topic = instructions.trim().replace(/\.$/, "");
  const subject =
    input.subject.trim() ||
    cap(topic.split(/\s+/).slice(0, 7).join(" ")).replace(/^(write|send|draft)\s+(an?\s+)?(email\s+)?(to\s+)?/i, "");
  const greet = { Formal: `Dear ${recipient},`, Friendly: `Hi ${recipient},`, Persuasive: `Hello ${recipient},` }[tone];
  const open = {
    Formal: `I am writing regarding the following matter: ${topic}.`,
    Friendly: `Hope your week is going well! I wanted to reach out about something: ${topic}.`,
    Persuasive: `I'd like to share an opportunity that I believe is worth your attention: ${topic}.`,
  }[tone];
  const body = {
    Formal: `To ensure we proceed efficiently, I would appreciate your review of the points above and any feedback you may have. Please let me know if additional documentation or a meeting would be helpful.`,
    Friendly: `Let me know what you think when you get a moment — happy to jump on a quick call if that's easier. No rush, but a reply by the end of the week would be great.`,
    Persuasive: `Acting on this now would help us save time, reduce friction, and deliver visible results sooner. I'm confident that with your support we can move this forward quickly — could we agree on next steps by Friday?`,
  }[tone];
  const close = { Formal: "Kind regards,", Friendly: "Cheers,", Persuasive: "Looking forward to your response," }[tone];
  return `Subject: ${subject}\n\n${greet}\n\n${open}\n\n${body}\n\n${close}\n${sender}`;
}

export type ResearchResult = {
  source: string;
  urlNotice?: string;
  summary: string;
  insights: string[];
  recommendations: string[];
};

const STOP = new Set("the a an and or of to in on for with is are was were be by that this it as at from have has will can we our your their they you i not but if more most into about".split(" "));

function keywords(text: string, n = 5) {
  const freq: Record<string, number> = {};
  for (const w of text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) if (!STOP.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}

export function research(input: { mode: "topic" | "article" | "url"; value: string }): ResearchResult {
  const v = input.value.trim();
  if (input.mode === "url") {
    let host = v;
    try { host = new URL(v).hostname; } catch { /* keep raw */ }
    return {
      source: v,
      urlNotice: `URL content could not be accessed. This prototype runs entirely in your browser and cannot fetch ${host}. The analysis below is based only on the address itself — paste the article text for a content-based summary.`,
      summary: `The link points to ${host}. Without the page content, only the domain and path can be considered: ${v.replace(/^https?:\/\//, "")}.`,
      insights: [`Source domain: ${host} — check its credibility and publication date.`, `URL path hints at: ${(v.split("/").filter(Boolean).pop() ?? host).replace(/[-_]/g, " ")}.`],
      recommendations: ["Copy the article text and use the “Paste article” option.", "Verify the author and date before citing the source."],
    };
  }
  if (input.mode === "article") {
    const sentences = v.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
    const kw = keywords(v);
    const words = v.split(/\s+/).length;
    return {
      source: `Pasted article (${words} words)`,
      summary: sentences.slice(0, 3).join(" ") || firstSentence(v),
      insights: [
        `Most frequent themes: ${kw.join(", ") || "n/a"}.`,
        ...sentences.filter((s) => /\d/.test(s)).slice(0, 2).map((s) => `Data point: ${s}`),
        sentences.length > 3 ? `Concluding point: ${sentences[sentences.length - 1]}` : `The text is short (${sentences.length} key sentences); consider adding more context.`,
      ],
      recommendations: [
        `Share a brief on “${kw[0] ?? "the main topic"}” with relevant stakeholders.`,
        `Validate claims about ${kw.slice(1, 3).join(" and ") || "the key figures"} against a second source.`,
        "Turn the top insight into one concrete action item with an owner and deadline.",
      ],
    };
  }
  const t = v;
  return {
    source: `Topic: ${t}`,
    summary: `“${t}” is best approached by clarifying its business goal, the people it affects, and how success will be measured. A structured review covers current state, common challenges, and practical next steps for a workplace context.`,
    insights: [
      `Define what “${t}” means for your team specifically — scope creep is the most common failure point.`,
      `Look for existing internal data on ${t} before commissioning new research.`,
      `Stakeholder alignment usually matters more than tooling when adopting ${t}.`,
      `Track 2–3 measurable indicators (time saved, cost, quality) linked to ${t}.`,
    ],
    recommendations: [
      `Run a 30-minute discovery session on ${t} with key stakeholders.`,
      `Draft a one-page brief: problem, goal, metrics, risks.`,
      `Pilot on a small scope for 2–4 weeks, then review results.`,
    ],
  };
}

export function chatReply(msg: string, history: { role: string; content: string }[]): string {
  const m = msg.toLowerCase();
  const turns = history.filter((h) => h.role === "user").length;
  const ctx = turns > 1 ? `\n\n(Building on our earlier conversation — ${turns - 1} previous message${turns > 2 ? "s" : ""} in this session.)` : "";
  if (/summar|tl;?dr/.test(m)) {
    const text = msg.replace(/^.*?(summari[sz]e|summary|tl;?dr)[:\s]*/i, "");
    const s = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (s.length < 2) return "Paste the text you'd like summarised after your request (e.g. “Summarise: …”) and I'll condense it into key points." + ctx;
    return `**Summary**\n• ${s.slice(0, 3).join("\n• ")}\n\n**Key themes:** ${keywords(text, 4).join(", ")}` + ctx;
  }
  if (/brainstorm|ideas?\b/.test(m)) {
    const topic = msg.replace(/.*?(brainstorm|ideas?)\s*(for|on|about)?\s*/i, "").replace(/[?.]$/, "") || "your goal";
    return `Here are ideas for **${topic}**:\n1. Quick win: a low-effort version of ${topic} you could test this week.\n2. Ask 3 users/colleagues what frustrates them most about ${topic}.\n3. Benchmark how a competitor or another team handles ${topic}.\n4. Automate one repetitive step related to ${topic}.\n5. Set a measurable 30-day target for ${topic}.\n\nWant me to expand any of these into an action plan?` + ctx;
  }
  if (/draft|write|email|message|memo/.test(m)) {
    return `Here's a draft based on your request:\n\n---\nHi team,\n\n${cap(msg.replace(/^(please\s+)?(draft|write)\s+(an?\s+)?/i, "").replace(/[.?]$/, ""))} — I wanted to share this so we're aligned. Key points:\n• Context and goal\n• What's needed and by when\n• Who to contact with questions\n\nThanks,\n[Your name]\n---\n\nTell me the audience and tone and I'll refine it.` + ctx;
  }
  if (/meeting|agenda/.test(m)) {
    return `**Suggested meeting agenda**\n1. Purpose & desired outcome (5 min)\n2. Updates / context (10 min)\n3. Discussion: main decision points (20 min)\n4. Actions, owners, deadlines (10 min)\n\nTip: share the agenda 24h ahead and end with a written recap.` + ctx;
  }
  if (/priorit|overwhelm|deadline|time|focus/.test(m)) {
    return `Let's untangle that:\n1. List every task, then mark each as **Urgent/Important** (Eisenhower matrix).\n2. Do 1–3 important tasks first, in focused 50-minute blocks.\n3. Delegate or renegotiate deadlines on the rest — early communication beats late delivery.\n4. Block 15 minutes at the end of the day to plan tomorrow.` + ctx;
  }
  return `Got it — “${firstSentence(msg)}”. A practical way to approach this:\n1. Clarify the outcome you need and by when.\n2. Identify who else is involved or affected.\n3. Break it into the next 2–3 concrete steps.\n\nI can help draft, brainstorm, summarise, or plan — tell me more details and I'll be more specific.` + ctx;
}
