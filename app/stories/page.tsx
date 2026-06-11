"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrent } from "@/lib/storage";
import StoryReader from "@/components/StoryReader";
import type { StorySet } from "@/lib/types";

export default function StoriesPage() {
  const router = useRouter();
  const [set, setSet] = useState<StorySet | null>(null);

  useEffect(() => {
    const data = getCurrent();
    if (!data) router.replace("/");
    else setSet(data);
  }, [router]);

  if (!set) return null;
  return <StoryReader set={set} />;
}
