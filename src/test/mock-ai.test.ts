import { describe, expect, it } from "vitest";
import { chatReply, generateEmail, research } from "@/lib/mock-ai";

describe("Offline response grounding", () => {
  it.each(["Formal", "Friendly", "Persuasive"] as const)("preserves the email request in %s tone without adding a deadline", tone => {
    const result = generateEmail({ instructions: "Ask Sarah to approve the R8,000 equipment budget by Tuesday", recipient: "Sarah", subject: "Equipment approval", sender: "Axolile", tone });
    expect(result).toContain("approve the R8,000 equipment budget by Tuesday");
    expect(result).toContain("Subject: Equipment approval");
    expect(result).toContain("Axolile");
    expect(result).not.toMatch(/Friday|end of the week|quick call|save time/);
  });
  it("extracts article statements rather than inventing workplace advice", () => {
    const article = "The library opened on Monday. The council invested R2 million in new books. Visitors can borrow five books at a time. The library closes on Sunday.";
    const result = research({ mode: "article", value: article });
    for (const insight of result.insights) expect(article).toContain(insight);
    expect(result.summary).toContain("R2 million");
    expect(result.summary).not.toContain("stakeholder");
  });
  it("does not fabricate findings from a topic", () => {
    const result = research({ mode: "topic", value: "Water conservation in Cape Town" });
    expect(result.summary).toContain("Water conservation in Cape Town");
    expect(result.insights).toEqual([]);
    expect(result.urlNotice).toContain("no web search");
  });
  it("does not infer article content from a URL", () => {
    const result = research({ mode: "url", value: "https://example.com/research" });
    expect(result.insights).toEqual([]);
    expect(result.summary).toContain("No summary available");
  });
  it("answers a greeting and handles a follow-up in context", () => {
    expect(chatReply("Hello", [{role: "user", content: "Hello"}])).toContain("Hello!");
    const first = "Write an email asking for budget approval by Tuesday";
    const answer = chatReply(first, [{role: "user", content: first}]);
    const result = chatReply("Make it friendly", [{role: "user", content: first}, {role: "assistant", content: answer}, {role: "user", content: "Make it friendly"}]);
    expect(result).toContain("budget approval by Tuesday");
    expect(result).toContain("Hi [Recipient]");
    expect(result).not.toContain("Make it friendly");
  });
});