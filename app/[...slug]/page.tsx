import { redirect } from "next/navigation";

export default async function UrlCatchAll({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  let raw = slug.join("/");
  // Some HTTP clients encode ':' as '%3A' when following 308 redirects — fix it
  raw = raw.replace(/^(https?)%3A/i, "$1:");
  // Vercel collapses // in paths (308 redirect), so we get "https:/domain.com" — restore the slash
  const url = /^https?:\//.test(raw)
    ? raw.replace(/^(https?:\/)([^/])/, "$1/$2")
    : "https://" + raw;
  redirect("/?url=" + encodeURIComponent(url));
}
