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
  coverImageUrl?: string;
  cards: StoryCard[];
  savedAt: string;
}

export interface InboxItem {
  id: string;
  clerk_user_id: string;
  url: string | null;
  item_type: string;
  title: string | null;
  status: "pending" | "processing" | "done" | "error";
  error_msg: string | null;
  created_at: string;
  processed_at: string | null;
  story_set_id?: string | null;
}

export interface Note {
  id: string;
  card_index: number | null;
  content: string;
  created_at: string;
}
