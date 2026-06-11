import { load } from "cheerio";

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

async function handleUrl(url: string) {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StoriesBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    html = await res.text();
  } catch {
    return Response.json({ error: "Could not fetch URL" }, { status: 422 });
  }

  const $ = load(html);

  // remove noise
  $("script, style, nav, header, footer, aside, .ad, .sidebar, iframe, noscript").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text().trim() ||
    new URL(url).hostname;

  // try article body first, fall back to body
  const container =
    $("article").length ? $("article") :
    $("main").length ? $("main") :
    $("body");

  const text = container
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);

  if (text.length < 100) {
    return Response.json({ error: "Not enough readable text on this page" }, { status: 422 });
  }

  return Response.json({ text, title, source: "url", sourceUrl: url });
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
    // dynamic import avoids pdf-parse reading a test file at module eval time
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
