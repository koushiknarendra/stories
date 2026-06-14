"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getCurrent } from "@/lib/storage";
import StoryReader from "@/components/StoryReader";
import type { StorySet } from "@/lib/types";

export default function StoriesPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [set, setSet] = useState<StorySet | null>(null);
  const [storySetId, setStorySetId] = useState<string | undefined>(undefined);
  const saved = { current: false };

  useEffect(() => {
    const data = getCurrent();
    if (!data) { router.replace("/"); return; }
    setSet(data);
  }, [router]);

  useEffect(() => {
    if (!set || !isLoaded || !isSignedIn || saved.current) return;
    saved.current = true;
    fetch("/api/space", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(set),
    })
      .then(r => r.json())
      .then(data => { if (data.id) setStorySetId(data.id); })
      .catch(() => {});
  }, [set, isLoaded, isSignedIn]);

  if (!set) return null;
  return <StoryReader set={set} storySetId={storySetId} />;
}
