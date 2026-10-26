CREATE TABLE IF NOT EXISTS newsletter_email_change_requests (
  subscriber_id INTEGER PRIMARY KEY REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  old_email TEXT NOT NULL,
  new_email TEXT NOT NULL,
  old_first_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS newsletter_email_change_requests_expiry_idx
  ON newsletter_email_change_requests (expires_at);
