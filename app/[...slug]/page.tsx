import { redirect } from "next/navigation";

export default async function UrlCatchAll({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const url = "https://" + slug.join("/");
  redirect("/?url=" + encodeURIComponent(url));
}
