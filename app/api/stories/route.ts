import Anthropic from "@anthropic-ai/sdk";
import { buildClassifyPrompt } from "@/lib/cardPrompt";

export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(request: Request) {
  const { text, title, source, sourceUrl, imageUrl } = await request.json();

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const prompt = buildClassifyPrompt(text, title, source);

  let cards;
  let category: string | null = null;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3072,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;

      try {
        const parsed = JSON.parse(match[0]);
        cards = parsed.cards;
        category = parsed.category ?? null;
        break;
      } catch {
        continue;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Claude API error";
    return Response.json({ error: msg }, { status: 500 });
  }

  if (!cards) {
    return Response.json({ error: "Failed to generate story cards" }, { status: 500 });
  }

  return Response.json({ cards, title, source, sourceUrl, imageUrl: imageUrl ?? null, category });
}
