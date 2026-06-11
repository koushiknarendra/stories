import postgres from "postgres";

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
      id          SERIAL      PRIMARY KEY,
      device_id   TEXT        NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
      story_id    TEXT        NOT NULL,
      story_title TEXT,
      story_source TEXT,
      action      TEXT        NOT NULL CHECK (action IN ('like', 'dislike')),
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (device_id, story_id)
    )
  `;
}
