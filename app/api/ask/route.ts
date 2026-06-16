import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAllCardsForUser } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "No question provided" }, { status: 400 });

  const cards = await getAllCardsForUser(userId);
  if (!cards.length) return NextResponse.json({ answer: "Your library is empty — add some articles first." });

  // Build a condensed context of all cards
  const context = cards.map((c) =>
    `[${c.storyTitle}]\n• ${c.headline}\n${c.bullets.map((b) => `  - ${b}`).join("\n")}`
  ).join("\n\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: [
      {
        type: "text",
        text: `You are a personal knowledge assistant. The user has a library of articles they've read, summarized as story cards below. Answer their question using ONLY information from this library. Always cite which article(s) the information comes from by name. Be concise (3-5 sentences max). If the library doesn't contain relevant info, say so briefly.\n\n--- LIBRARY ---\n${context}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: question.trim() }],
  });

  const answer = message.content[0]?.type === "text" ? message.content[0].text : "Sorry, I couldn't generate an answer.";
  return NextResponse.json({ answer });
}
