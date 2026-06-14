export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handlePdf(request);
  }

  const body = await request.json();
  if (body.url) {
    return handleUrl(body.url as string);
  }
  if (body.text) {
    return Response.json({ text: body.text, title: "Pasted text", source: "text" });
  }

  return Response.json({ error: "Provide url, text, or a PDF file" }, { status: 400 });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const shortsMatch = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split(/[?#]/)[0] || null;
    }
  } catch {}
  return null;
}

function cleanYouTubeJinaText(raw: string): string {
  // Strip all images FIRST (including emoji images like ![Image N: 💀](youtube.com/...))
  // then replace remaining YouTube/Google nav links with their text
  const text = raw
    .replace(/!\[.*?\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?(?:youtube|accounts\.google|support\.google)\.com[^)]*\)/g, "$1");

  // Extract video title from Jina header
  const titleMatch = raw.match(/^Title:\s*(.+)/m);
  const videoTitle = titleMatch?.[1]?.trim().replace(/\s*-\s*YouTube$/i, "").trim() ?? "";

  // Extract transcript section (timestamped lines like "0:05 text here")
  const transcriptMatch = text.match(/##\s*Transcript[\s\S]*?\n((?:(?:\d+:\d+|\d+\.\d+)\s+[^\n]+\n?)+)/i);
  const transcript = transcriptMatch?.[1]?.replace(/\d+:\d+\s*/g, "").replace(/\n+/g, " ").trim() ?? "";

  // Extract description — stop at the first metadata line (view counts, likes, "Auto-dubbed" etc.)
  const descMatch = text.match(/##\s*Description\s*\n([\s\S]+?)(?=\n##|$)/i);
  const rawDescLines = (descMatch?.[1] ?? "").split(/\n/).map(l => l.trim());
  const metaStop = /^(\d[\d,.]+K?M?B?\s*(likes?|views?|subscribers?)?$|…+$|\d+[hd]\s*ago$|auto-dubbed$|audio tracks|how this was made|transcript$|follow along|show transcript|learn more$)/i;
  const descLines: string[] = [];
  for (const line of rawDescLines) {
    if (metaStop.test(line)) break;
    if (line.length > 0 && line !== videoTitle) descLines.push(line);
  }
  const description = descLines.join("\n").trim().slice(0, 800);

  // Extract comments — after link replacement format is "### @username" per block.
  // Split on that, skip the username (lines[0]) and timestamp (lines[1]), take comment text.
  const commentsMatch = text.match(/##\s+\d+\s+[Cc]omments?\s*\n([\s\S]+?)(?=\n##\s+[A-Za-z]|$)/i);
  const junkLine = /^(show less|hide|read more|like$|dislike|repl(y|ies)|❤ by|sort|add a comment|·$|\d+$)/i;
  const commentTexts = (commentsMatch?.[1] ?? "")
    .split(/###\s+@/)
    .slice(1, 30)
    .map(block => {
      // block: "USERNAME\n\nN hours ago\n\nComment text\n\nShow less...\n..."
      const lines = block.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
      // Skip username (lines[0]) and timestamp (lines[1]), grab substantive content
      return lines
        .slice(2)
        .filter(l => !junkLine.test(l) && l.length > 10)
        .slice(0, 2)
        .join(" ")
        .trim();
    })
    .filter(c => c.length > 25);
  // Sort longer comments first (more substantive), take top 7
  const comments = commentTexts
    .sort((a, b) => b.length - a.length)
    .slice(0, 7)
    .join("\n");

  const parts: string[] = [];
  if (videoTitle) parts.push(`Video: ${videoTitle}`);
  if (transcript.length > 60) parts.push(`Transcript:\n${transcript.slice(0, 3000)}`);
  if (description.length > 50) parts.push(`Description:\n${description}`);
  if (comments.length > 60 && transcript.length < 100) parts.push(`Viewer discussion:\n${comments}`);

  return parts.join("\n\n");
}

async function fetchYouTubeContent(videoId: string): Promise<{ title: string; text: string } | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch(`https://r.jina.ai/${watchUrl}`, {
      headers: { "X-Return-Format": "markdown" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    // Get raw markdown BEFORE any whitespace collapsing so cleanYouTubeJinaText can parse sections
    const raw = await res.text();
    const titleMatch = raw.match(/^Title:\s*(.+)/m);
    const title = titleMatch?.[1]?.trim().replace(/\s*-\s*YouTube$/i, "").trim() ?? "YouTube Video";
    const cleaned = cleanYouTubeJinaText(raw);
    // Require meaningful content beyond just the title line
    const contentBeyondTitle = cleaned.replace(`Video: ${title}`, "").trim();
    return contentBeyondTitle.length >= 120 ? { title, text: cleaned } : null;
  } catch {
    return null;
  }
}

async function handleYouTube(videoId: string, originalUrl: string) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const [ytContent, ogImage] = await Promise.all([
    fetchYouTubeContent(videoId),
    fetchOgImage(watchUrl),
  ]);

  if (ytContent) {
    return Response.json({
      text: ytContent.text,
      title: ytContent.title,
      source: "YouTube",
      sourceUrl: originalUrl,
      imageUrl: ogImage ?? thumbUrl,
    });
  }

  return Response.json(
    { error: "Couldn't extract enough content from this video. Try a video with captions, or paste the transcript directly." },
    { status: 422 }
  );
}

async function handleUrl(url: string) {
  // YouTube — needs transcript extraction, not HTML scraping
  const ytId = extractYouTubeId(url);
  if (ytId) return handleYouTube(ytId, url);

  // Run Jina text fetch and OG image fetch in parallel
  const [jinaResult, ogImage] = await Promise.all([
    fetchViaJina(url),
    fetchOgImage(url),
  ]);

  if (jinaResult) {
    return Response.json({ text: jinaResult.text, title: jinaResult.title, source: "url", sourceUrl: url, imageUrl: ogImage });
  }

  const direct = await fetchDirect(url);
  if (!direct) {
    return Response.json(
      { error: "Could not fetch this page. Try pasting the article text directly." },
      { status: 422 }
    );
  }

  return Response.json({ text: direct.text, title: direct.title, source: "url", sourceUrl: url, imageUrl: direct.imageUrl });
}

async function handlePdf(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > 20 * 1024 * 1024) {
    return Response.json({ error: "PDF too large (max 20 MB)" }, { status: 413 });
  }

  let text: string;
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    text = parsed.text.replace(/\s+/g, " ").trim().slice(0, 12_000);
  } catch {
    return Response.json({ error: "Could not parse PDF" }, { status: 422 });
  }

  if (text.length < 100) {
    return Response.json({ error: "PDF has no extractable text (may be image-based)" }, { status: 422 });
  }

  const title = (file as File).name.replace(/\.pdf$/i, "") || "Uploaded PDF";

  return Response.json({ text, title, source: "pdf" });
}
