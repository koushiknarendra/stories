export interface StoryCard {
  headline: string;
  bullets: string[];
  readTime: string;
}

export interface StorySet {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  cards: StoryCard[];
  savedAt: string;
}
