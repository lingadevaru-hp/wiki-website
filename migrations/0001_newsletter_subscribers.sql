-- Newsletter subscribers on Cloudflare D1 (free tier, no paid Postgres).
-- Mirrors lib/db/src/schema/index.ts so a future Postgres backfill stays compatible.
-- Welcome emails are sent later by the Node email sender; until then
-- welcome_email_sent_at stays NULL (pending).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  welcome_email_sent_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_idx
  ON newsletter_subscribers (email);
