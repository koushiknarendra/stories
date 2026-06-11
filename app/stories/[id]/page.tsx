import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { loadStorySet } from "@/lib/db";
import StoryReader from "@/components/StoryReader";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StoriesIdPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const set = await loadStorySet(id, userId);
  if (!set) notFound();

  return <StoryReader set={set} storySetId={id} />;
}
