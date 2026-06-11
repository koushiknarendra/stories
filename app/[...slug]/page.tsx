import { redirect } from "next/navigation";

export default async function UrlCatchAll({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const raw = slug.join("/");
  // If the user typed https:// or http://, browsers collapse the double-slash
  // in the path, so we get "https:/domain.com" — restore the missing slash.
  const url = /^https?:\//.test(raw)
    ? raw.replace(/^(https?:\/)([^/])/, "$1/$2")
    : "https://" + raw;
  redirect("/?url=" + encodeURIComponent(url));
}
