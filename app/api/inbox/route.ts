export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  createInboxItem,
  markInboxItemDone,
  markInboxItemError,
  listInboxItems,
  deleteInboxItem,
  saveStorySet,
} from "@/lib/db";
import type { StoryCard, StorySet } from "@/lib/types";

const client = new Anthropic();

// ─── Parsing helpers (mirrored from /api/parse) ───────────────────────────────

async function fetchViaJina(url: string): Promise<{ title: string; text: string } | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "X-Return-Format": "markdown" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const raw = await res.text();
    const titleMatch = raw.match(/^Title:\s*(.+)/m);
    const title = titleMatch?.[1]?.trim() || new URL(url).hostname;
    const text = raw
      .replace(/^(Title|URL Source|Published Time|Description|Warning|Markdown Content):.*\n?/gm, "")
      .replace(/!\[Image[^\]]*\]\([^)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);
    return text.length >= 100 ? { title, text } : null;
  } catch {
    return null;
  }
}

function toAbsoluteUrl(base: string, href: string | undefined): string | null {
  if (!href) return null;
  try { return new URL(href, base).href; } catch { return null; }
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const { load } = await import("cheerio");
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);
    const raw =
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image:src']").attr("content") ||
      $("meta[name='twitter:image']").attr("content");
    return toAbsoluteUrl(url, raw);
  } catch {
    return null;
  }
}

async function fetchDirect(url: string): Promise<{ title: string; text: string; imageUrl: string | null } | null> {
  try {
    const { load } = await import("cheerio");
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);
    $("script, style, nav, header, footer, aside, .ad, iframe, noscript").remove();
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text().trim() ||
      new URL(url).hostname;
    const rawImg =
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image:src']").attr("content") ||
      $("meta[name='twitter:image']").attr("content");
    const imageUrl = toAbsoluteUrl(url, rawImg);
    const container = $("article").length ? $("article") : $("main").length ? $("main") : $("body");
    const text = container.text().replace(/\s+/g, " ").trim().slice(0, 12_000);
    return text.length >= 100 ? { title, text, imageUrl } : null;
  } catch {
    return null;
  }
}

// ─── Card generation helper (mirrored from /api/stories) ─────────────────────

async function generateCards(
  text: string,
  title: string,
  source: string
): Promise<StoryCard[] | null> {
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
  return null;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listInboxItems(userId);
  return Response.json(items);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const url = (body.url as string | undefined)?.trim() || null;
  const text = (body.text as string | undefined)?.trim() || null;

  if (!url && !text) {
    return Response.json({ error: "Provide a URL or text" }, { status: 400 });
  }

  const item = await createInboxItem(userId, url, url ? "url" : "text");

  try {
    let parseResult: { title: string; text: string } | null = null;

    let coverImageUrl: string | null = null;

    if (url) {
      const [jinaResult, ogImage] = await Promise.all([fetchViaJina(url), fetchOgImage(url)]);
      if (jinaResult) {
        parseResult = jinaResult;
        coverImageUrl = ogImage;
      } else {
        const direct = await fetchDirect(url);
        if (!direct) {
          await markInboxItemError(item.id, "Could not fetch this URL");
          return Response.json({ error: "Could not fetch this URL. Try pasting the text directly." }, { status: 422 });
        }
        parseResult = direct;
        coverImageUrl = direct.imageUrl;
      }
    } else {
      parseResult = { text: text!, title: "Pasted text" };
    }

    const cards = await generateCards(parseResult.text, parseResult.title, url ? "url" : "text");
    if (!cards) {
      await markInboxItemError(item.id, "Failed to generate story cards");
      return Response.json({ error: "Failed to generate story cards" }, { status: 500 });
    }

    const storySet: StorySet = {
      id: crypto.randomUUID(),
      title: parseResult.title,
      source: url ? "url" : "text",
      sourceUrl: url ?? undefined,
      coverImageUrl: coverImageUrl ?? undefined,
      cards,
      savedAt: new Date().toISOString(),
    };

    await saveStorySet(userId, item.id, storySet, cards);
    await markInboxItemDone(item.id, storySet.title);

    return Response.json({ id: storySet.id, title: storySet.title, itemId: item.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await markInboxItemError(item.id, msg).catch(() => {});
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  await deleteInboxItem(id as string, userId);
  return Response.json({ ok: true });
}
