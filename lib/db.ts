import postgres from "postgres";
import type { StorySet, StoryCard, InboxItem, Note } from "./types";

let _sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (!_sql) {
    _sql = postgres(process.env.DATABASE_URL, {
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : "require",
      max: 3,
      idle_timeout: 20,
    });
  }
  return _sql;
}

export async function runMigration() {
  const sql = getDb();
  if (!sql) throw new Error("DATABASE_URL is not set");

  await sql`
    CREATE TABLE IF NOT EXISTS devices (
      id         TEXT        PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS interactions (
      id           SERIAL      PRIMARY KEY,
      device_id    TEXT        NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
      story_id     TEXT        NOT NULL,
      story_title  TEXT,
      story_source TEXT,
      action       TEXT        NOT NULL CHECK (action IN ('like', 'dislike')),
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (device_id, story_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS inbox_items (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT        NOT NULL,
      url           TEXT,
      item_type     TEXT        NOT NULL DEFAULT 'url',
      title         TEXT,
      status        TEXT        NOT NULL DEFAULT 'pending',
      error_msg     TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      processed_at  TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS inbox_items_user_idx ON inbox_items(clerk_user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS story_sets (
      id              TEXT        PRIMARY KEY,
      clerk_user_id   TEXT        NOT NULL,
      inbox_item_id   UUID        REFERENCES inbox_items(id),
      title           TEXT        NOT NULL,
      source          TEXT        NOT NULL,
      source_url      TEXT,
      saved_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS story_sets_user_idx ON story_sets(clerk_user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS story_cards (
      id            SERIAL      PRIMARY KEY,
      story_set_id  TEXT        REFERENCES story_sets(id) ON DELETE CASCADE,
      card_index    INT         NOT NULL,
      headline      TEXT        NOT NULL,
      bullets       JSONB       NOT NULL,
      read_time     TEXT        NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT        NOT NULL,
      story_set_id  TEXT        REFERENCES story_sets(id) ON DELETE CASCADE,
      card_index    INT,
      content       TEXT        NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS notes_set_idx ON notes(story_set_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS starred_bullets (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_user_id TEXT        NOT NULL,
      story_set_id  TEXT        REFERENCES story_sets(id) ON DELETE CASCADE,
      story_title   TEXT        NOT NULL,
      card_index    INT         NOT NULL,
      bullet_index  INT         NOT NULL,
      bullet_text   TEXT        NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(clerk_user_id, story_set_id, card_index, bullet_index)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS starred_bullets_user_idx ON starred_bullets(clerk_user_id)`;
}

// ─── Inbox helpers ────────────────────────────────────────────────────────────

export async function createInboxItem(
  clerkUserId: string,
  url: string | null,
  itemType = "url"
): Promise<InboxItem> {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  const [item] = await sql<[InboxItem]>`
    INSERT INTO inbox_items (clerk_user_id, url, item_type, status)
    VALUES (${clerkUserId}, ${url}, ${itemType}, 'processing')
    RETURNING *
  `;
  return item;
}

export async function markInboxItemDone(id: string, title: string) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  await sql`
    UPDATE inbox_items
    SET status = 'done', title = ${title}, processed_at = NOW()
    WHERE id = ${id}
  `;
}

export async function markInboxItemError(id: string, errorMsg: string) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  await sql`
    UPDATE inbox_items
    SET status = 'error', error_msg = ${errorMsg}
    WHERE id = ${id}
  `;
}

export async function listInboxItems(clerkUserId: string): Promise<InboxItem[]> {
  const sql = getDb();
  if (!sql) return [];
  return sql<InboxItem[]>`
    SELECT i.*, s.id AS story_set_id
    FROM inbox_items i
    LEFT JOIN story_sets s ON s.inbox_item_id = i.id
    WHERE i.clerk_user_id = ${clerkUserId}
    ORDER BY i.created_at DESC
  `;
}

export async function deleteInboxItem(id: string, clerkUserId: string) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  await sql`DELETE FROM inbox_items WHERE id = ${id} AND clerk_user_id = ${clerkUserId}`;
}

// ─── Story set helpers ────────────────────────────────────────────────────────

export async function saveStorySet(
  clerkUserId: string,
  inboxItemId: string,
  set: StorySet,
  cards: StoryCard[]
) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");

  await sql`
    INSERT INTO story_sets (id, clerk_user_id, inbox_item_id, title, source, source_url)
    VALUES (${set.id}, ${clerkUserId}, ${inboxItemId}, ${set.title}, ${set.source}, ${set.sourceUrl ?? null})
    ON CONFLICT (id) DO NOTHING
  `;

  for (const [i, card] of cards.entries()) {
    await sql`
      INSERT INTO story_cards (story_set_id, card_index, headline, bullets, read_time)
      VALUES (${set.id}, ${i}, ${card.headline}, ${JSON.stringify(card.bullets ?? [])}::jsonb, ${card.readTime})
    `;
  }
}

export async function loadStorySet(id: string): Promise<StorySet | null> {
  const sql = getDb();
  if (!sql) return null;

  // Load by ID only — UUID is 122 bits of entropy, effectively unguessable.
  const rows = await sql<{ id: string; title: string; source: string; source_url: string | null; saved_at: string }[]>`
    SELECT id, title, source, source_url, saved_at
    FROM story_sets
    WHERE id = ${id}
  `;
  if (!rows.length) return null;
  const set = rows[0];

  const cards = await sql<{ headline: string; bullets: unknown; read_time: string }[]>`
    SELECT headline, bullets, read_time
    FROM story_cards
    WHERE story_set_id = ${id}
    ORDER BY card_index
  `;

  return {
    id: set.id,
    title: set.title,
    source: set.source,
    sourceUrl: set.source_url ?? undefined,
    savedAt: set.saved_at,
    cards: cards.map((c) => {
      // bullets stored as JSONB — might come back as array, string, or null
      let bullets: string[] = [];
      if (Array.isArray(c.bullets)) {
        bullets = c.bullets as string[];
      } else if (typeof c.bullets === "string") {
        try { bullets = JSON.parse(c.bullets); } catch { bullets = [c.bullets]; }
      }
      return { headline: c.headline, bullets, readTime: c.read_time };
    }),
  };
}

export async function deleteStorySet(id: string, clerkUserId: string) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  await sql`DELETE FROM story_sets WHERE id = ${id} AND clerk_user_id = ${clerkUserId}`;
}

export async function listStorySets(clerkUserId: string) {
  const sql = getDb();
  if (!sql) return [];
  return sql<{ id: string; title: string; source: string; source_url: string | null; saved_at: string }[]>`
    SELECT id, title, source, source_url, saved_at
    FROM story_sets
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY saved_at DESC
  `;
}

// ─── Notes helpers ────────────────────────────────────────────────────────────

export async function addNote(
  clerkUserId: string,
  storySetId: string,
  cardIndex: number | null,
  content: string
): Promise<Note> {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  const [note] = await sql<[Note]>`
    INSERT INTO notes (clerk_user_id, story_set_id, card_index, content)
    VALUES (${clerkUserId}, ${storySetId}, ${cardIndex}, ${content})
    RETURNING id, card_index, content, created_at
  `;
  return note;
}

export async function listNotes(clerkUserId: string, storySetId: string): Promise<Note[]> {
  const sql = getDb();
  if (!sql) return [];
  return sql<Note[]>`
    SELECT id, card_index, content, created_at
    FROM notes
    WHERE clerk_user_id = ${clerkUserId} AND story_set_id = ${storySetId}
    ORDER BY created_at
  `;
}

export async function deleteNote(id: string, clerkUserId: string) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  await sql`DELETE FROM notes WHERE id = ${id} AND clerk_user_id = ${clerkUserId}`;
}

// ─── Starred bullets helpers ──────────────────────────────────────────────────

export interface StarredBullet {
  id: string;
  story_set_id: string;
  story_title: string;
  card_index: number;
  bullet_index: number;
  bullet_text: string;
  created_at: string;
}

export async function starBullet(
  clerkUserId: string,
  storySetId: string,
  storyTitle: string,
  cardIndex: number,
  bulletIndex: number,
  bulletText: string
): Promise<StarredBullet> {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  const [row] = await sql<[StarredBullet]>`
    INSERT INTO starred_bullets (clerk_user_id, story_set_id, story_title, card_index, bullet_index, bullet_text)
    VALUES (${clerkUserId}, ${storySetId}, ${storyTitle}, ${cardIndex}, ${bulletIndex}, ${bulletText})
    ON CONFLICT (clerk_user_id, story_set_id, card_index, bullet_index) DO NOTHING
    RETURNING id, story_set_id, story_title, card_index, bullet_index, bullet_text, created_at
  `;
  return row;
}

export async function unstarBullet(
  clerkUserId: string,
  storySetId: string,
  cardIndex: number,
  bulletIndex: number
) {
  const sql = getDb();
  if (!sql) throw new Error("DB not configured");
  await sql`
    DELETE FROM starred_bullets
    WHERE clerk_user_id = ${clerkUserId}
      AND story_set_id  = ${storySetId}
      AND card_index    = ${cardIndex}
      AND bullet_index  = ${bulletIndex}
  `;
}

export async function listStarredBullets(clerkUserId: string): Promise<StarredBullet[]> {
  const sql = getDb();
  if (!sql) return [];
  return sql<StarredBullet[]>`
    SELECT id, story_set_id, story_title, card_index, bullet_index, bullet_text, created_at
    FROM starred_bullets
    WHERE clerk_user_id = ${clerkUserId}
    ORDER BY created_at DESC
  `;
}

export async function listStarredForStory(clerkUserId: string, storySetId: string): Promise<StarredBullet[]> {
  const sql = getDb();
  if (!sql) return [];
  return sql<StarredBullet[]>`
    SELECT id, story_set_id, story_title, card_index, bullet_index, bullet_text, created_at
    FROM starred_bullets
    WHERE clerk_user_id = ${clerkUserId} AND story_set_id = ${storySetId}
  `;
}

// ─── Daily card helper ────────────────────────────────────────────────────────

export async function getDailyCard(clerkUserId: string): Promise<{
  storySetId: string;
  storyTitle: string;
  cardIndex: number;
  headline: string;
  bullet: string;
} | null> {
  const sql = getDb();
  if (!sql) return null;

  // Pick a card seeded by today's date so it's consistent within the day
  const rows = await sql<{ story_set_id: string; title: string; card_index: number; headline: string; bullets: unknown }[]>`
    SELECT sc.story_set_id, ss.title, sc.card_index, sc.headline, sc.bullets
    FROM story_cards sc
    JOIN story_sets ss ON ss.id = sc.story_set_id
    WHERE ss.clerk_user_id = ${clerkUserId}
    ORDER BY md5(ss.id || sc.card_index::text || current_date::text)
    LIMIT 1
  `;
  if (!rows.length) return null;

  const row = rows[0];
  let bullets: string[] = [];
  if (Array.isArray(row.bullets)) bullets = row.bullets as string[];
  else if (typeof row.bullets === "string") { try { bullets = JSON.parse(row.bullets); } catch { bullets = []; } }

  return {
    storySetId: row.story_set_id,
    storyTitle: row.title,
    cardIndex: row.card_index,
    headline: row.headline,
    bullet: bullets[0] ?? "",
  };
}

// ─── Library cards for Ask ────────────────────────────────────────────────────

export async function getAllCardsForUser(clerkUserId: string): Promise<{
  storyTitle: string;
  storySetId: string;
  sourceUrl: string | null;
  headline: string;
  bullets: string[];
}[]> {
  const sql = getDb();
  if (!sql) return [];

  const rows = await sql<{ story_set_id: string; title: string; source_url: string | null; headline: string; bullets: unknown }[]>`
    SELECT sc.story_set_id, ss.title, ss.source_url, sc.headline, sc.bullets
    FROM story_cards sc
    JOIN story_sets ss ON ss.id = sc.story_set_id
    WHERE ss.clerk_user_id = ${clerkUserId}
    ORDER BY ss.saved_at DESC, sc.card_index
    LIMIT 300
  `;

  return rows.map((r) => {
    let bullets: string[] = [];
    if (Array.isArray(r.bullets)) bullets = r.bullets as string[];
    else if (typeof r.bullets === "string") { try { bullets = JSON.parse(r.bullets); } catch { bullets = []; } }
    return { storySetId: r.story_set_id, storyTitle: r.title, sourceUrl: r.source_url, headline: r.headline, bullets };
  });
}
