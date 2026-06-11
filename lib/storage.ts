import type { StorySet } from "./types";

const CURATE_KEY = "stories_curate";
const CURRENT_KEY = "stories_current";
const DISLIKED_KEY = "stories_disliked";

export function saveCurrent(set: StorySet): void {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(set));
}

export function getCurrent(): StorySet | null {
  const raw = localStorage.getItem(CURRENT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getCurate(): StorySet[] {
  const raw = localStorage.getItem(CURATE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addToCurate(set: StorySet): void {
  const curate = getCurate();
  const exists = curate.some((s) => s.id === set.id);
  if (!exists) {
    curate.unshift(set);
    localStorage.setItem(CURATE_KEY, JSON.stringify(curate));
  }
}

export function removeFromCurate(id: string): void {
  const curate = getCurate().filter((s) => s.id !== id);
  localStorage.setItem(CURATE_KEY, JSON.stringify(curate));
}

export function recordDislike(id: string): void {
  const disliked: string[] = JSON.parse(localStorage.getItem(DISLIKED_KEY) ?? "[]");
  if (!disliked.includes(id)) {
    disliked.push(id);
    localStorage.setItem(DISLIKED_KEY, JSON.stringify(disliked));
  }
}

export function getDisliked(): string[] {
  return JSON.parse(localStorage.getItem(DISLIKED_KEY) ?? "[]");
}
