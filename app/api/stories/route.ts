import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(request: Request) {
  const { text, title, source, sourceUrl } = await request.json();

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const prompt = `You are a content summarizer for a mobile stories app.

Given this article/document, generate 5–7 story cards. Each card covers ONE key idea and is standalone.

Return ONLY a valid JSON array with this exact structure (no markdown, no prose):
[
  {
    "headline": "Short punchy statement (max 8 words)",
    "bullets": ["Specific fact or insight (max 20 words)", "Another point (max 20 words)", "Third point (max 20 words)"],
    "readTime": "15s"
  }
]

Rules:
- Headlines are declarative statements, not questions
- Bullets are concrete facts, numbers, or insights — no filler
- Each card must make sense without reading the others
- Total words per card (headline + 3 bullets) must be under 60
- readTime should reflect bullet density (10s–30s range)

Title: ${title}
Source: ${source}

Content:
${text.slice(0, 8000)}`;

  let cards;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) continue;

      try {
        cards = JSON.parse(match[0]);
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

  return Response.json({ cards, title, source, sourceUrl });
}
