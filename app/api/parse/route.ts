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
  // Strip markdown links that are just YouTube/Google navigation
  let text = raw
    .replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?(?:youtube|accounts\.google|support\.google)\.com[^)]*\)/g, "$1")
    .replace(/!\[.*?\]\([^)]*\)/g, "")
    .replace(/\[Sign in\].*?\n/gi, "")
    .replace(/Transcript Follow along.*?\n/gi, "")
    .replace(/Show transcript.*?\n/gi, "");

  // Extract transcript section (timestamped lines)
  const transcriptMatch = text.match(/##\s*Transcript[\s\S]*?\n((?:(?:\d+:\d+|\d+\.\d+)\s+[^\n]+\n?)+)/i);
  const transcript = transcriptMatch?.[1]?.replace(/\d+:\d+\s*/g, "").replace(/\n+/g, " ").trim() ?? "";

  // Extract description (everything between channel info and Comments section)
  const descMatch = text.match(/(?:##\s*Description\s*\n)([\s\S]+?)(?=\n##|$)/i);
  const rawDesc = descMatch?.[1]?.trim() ?? "";
  const description = rawDesc.includes("No description") ? "" : rawDesc.slice(0, 1000);

  // Extract video title (clean h1/h2 near top)
  const titleMatch = text.match(/^#\s+(.+?)(?:\s*-\s*YouTube)?\s*$/m);
  const videoTitle = titleMatch?.[1]?.trim() ?? "";

  // Extract comments section (limited — gives Claude human reactions to work with)
  const commentsMatch = text.match(/##\s+\d+\s+[Cc]omments?\s*\n([\s\S]+?)(?=\n##|$)/);
  const comments = commentsMatch?.[1]
    ?.split(/###\s+@/)
    .slice(1, 8)
    .map(c => c.replace(/\[.*?\]\(.*?\)/g, "").replace(/Like \d+.*$/m, "").split("\n")[0].trim())
    .filter(c => c.length > 20)
    .join("\n") ?? "";

  const parts: string[] = [];
  if (videoTitle) parts.push(`Video: ${videoTitle}`);
  if (transcript.length > 60) parts.push(`Transcript:\n${transcript.slice(0, 3000)}`);
  if (description.length > 30) parts.push(`Description:\n${description}`);
  if (comments.length > 80 && transcript.length < 100) parts.push(`Viewer reactions:\n${comments}`);

  return parts.join("\n\n");
}

async function handleYouTube(videoId: string, originalUrl: string) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const [jinaResult, ogImage] = await Promise.all([
    fetchViaJina(watchUrl),
    fetchOgImage(watchUrl),
  ]);

  const rawText = jinaResult?.text ?? "";
  const cleaned = cleanYouTubeJinaText(rawText);
  const title = jinaResult?.title?.replace(/\s*-\s*YouTube$/i, "").trim() ?? "YouTube Video";

  if (cleaned.length >= 80) {
    return Response.json({
      text: cleaned,
      title,
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
