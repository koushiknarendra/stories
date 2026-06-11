import { unstable_cache } from "next/cache";
import { load } from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import type { StoryCard, StorySet } from "./types";

const client = new Anthropic();

async function fetchAndParse(url: string): Promise<{ text: string; title: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; StoriesBot/1.0)" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) throw new Error(`Could not fetch page (${res.status})`);

  const html = await res.text();
  const $ = load(html);

  $("script, style, nav, header, footer, aside, .ad, iframe, noscript").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text().trim() ||
    new URL(url).hostname;

  const container =
    $("article").length ? $("article") :
    $("main").length ? $("main") :
    $("body");

  const text = container.text().replace(/\s+/g, " ").trim().slice(0, 12_000);

  if (text.length < 100) throw new Error("Not enough readable text on this page");

  return { text, title };
}

async function generateCards(text: string, title: string): Promise<StoryCard[]> {
  const prompt = `You are a content summarizer for a mobile stories app.

Given this article, generate 5–7 story cards. Each card covers ONE key idea and is completely standalone.

Return ONLY a valid JSON array — no markdown, no prose:
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
- Each card must make sense on its own
- Total words per card must be under 60
- readTime is in the 10s–30s range

Title: ${title}

Content:
${text.slice(0, 8_000)}`;

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
      return JSON.parse(match[0]) as StoryCard[];
    } catch {
      continue;
    }
  }

  throw new Error("Failed to generate story cards");
}

// Cache per URL for 24 hours — same URL shared by multiple users returns instantly
export const getStoriesForUrl = unstable_cache(
  async (url: string): Promise<StorySet> => {
    const { text, title } = await fetchAndParse(url);
    const cards = await generateCards(text, title);
    return {
      id: Buffer.from(url).toString("base64").slice(0, 16),
      title,
      source: "url",
      sourceUrl: url,
      cards,
      savedAt: new Date().toISOString(),
    };
  },
  ["stories-url"],
  { revalidate: 86_400 }
);

export function reconstructUrl(slug: string[]): string {
  let joined = slug.join("/");
  // Browsers normalize https:// → https:/ in paths, so we restore the double slash
  joined = joined.replace(/^(https?:)\/*/, "$1//");
  // If no protocol supplied, assume https
  if (!/^https?:\/\//.test(joined)) {
    joined = "https://" + joined;
  }
  return joined;
}
