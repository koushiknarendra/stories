import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadStorySet } from "@/lib/db";
import StoryReader from "@/components/StoryReader";

// Story content never changes after creation — cache at edge indefinitely
export const revalidate = false;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const set = await loadStorySet(id);
  if (!set) return {};

  const description = set.cards[0]?.headline ?? "Story cards on Storis";

  return {
    title: `${set.title} · Storis`,
    description,
    openGraph: {
      title: set.title,
      description,
      url: `https://storis.in/stories/${id}`,
      siteName: "Storis",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: set.title,
      description,
    },
  };
}

export default async function StoriesIdPage({ params }: Props) {
  const { id } = await params;
  const set = await loadStorySet(id);
  if (!set) notFound();
  return <StoryReader set={set} storySetId={id} />;
}
