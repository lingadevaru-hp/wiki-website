-- Newsletter resubscribe/edit history (applied after 0001).
-- newsletter_subscribers gains updated_at; every edit or resubscribe-with-
-- new-details appends one row to newsletter_history so the owner can see
-- both the previous and the replacement name+email (action + timestamps).
ALTER TABLE newsletter_subscribers ADD COLUMN updated_at TEXT;
CREATE TABLE IF NOT EXISTS newsletter_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  old_email TEXT NOT NULL,
  new_email TEXT NOT NULL,
  old_name TEXT,
  new_name TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS newsletter_history_new_email_idx
  ON newsletter_history (new_email);
CREATE INDEX IF NOT EXISTS newsletter_history_old_email_idx
  ON newsletter_history (old_email);
