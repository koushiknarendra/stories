import { notFound } from "next/navigation";
import { loadStorySet } from "@/lib/db";
import StoryReader from "@/components/StoryReader";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StoriesIdPage({ params }: Props) {
  const { id } = await params;
  const set = await loadStorySet(id);
  if (!set) notFound();
  return <StoryReader set={set} storySetId={id} />;
}
