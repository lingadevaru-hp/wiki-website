/**
 * Sends pending newsletter welcome emails stored in Cloudflare D1.
 *
 * Free-tier design: signups are collected by the Worker into D1 with no
 * server running. Run this script from any machine holding the Zoho SMTP
 * app password to deliver everything pending:
 *
 *   node --env-file-if-exists=.env ./dist/scripts/send-pending-welcome-emails.mjs \
 *     --db wiki-newsletter [--limit 100] [--dry-run]
 *
 * Per subscriber it sends the localized welcome email, then a best-effort
 * owner alert, then marks the row sent (only if still pending, so parallel
 * runs never double-send). Subscriber PII is never printed to stdout/logs.
 */
import { execFileSync } from "node:child_process";
import {
  sendNewsletterOwnerAlert,
  sendNewsletterWelcomeEmail,
} from "../services/emailService.js";

type PendingSubscriber = {
  id: number;
  firstName: string;
  email: string;
  language: string;
  subscribedAt: string;
};

function usage(): never {
  console.error(
    "Usage: send-pending-welcome-emails.mjs --db <d1-name> [--limit N] [--dry-run]",
  );
  process.exit(2);
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function d1Query(db: string, sql: string): unknown[] {
  const raw = execFileSync(
    "wrangler",
    ["d1", "execute", db, "--remote", "--json", "--command", sql],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
  );
  const parsed: unknown = JSON.parse(raw);
  const batches = Array.isArray(parsed) ? parsed : [parsed];
  const rows: unknown[] = [];
  for (const batch of batches) {
    if (
      batch !== null &&
      typeof batch === "object" &&
      "results" in batch &&
      Array.isArray((batch as { results: unknown }).results)
    ) {
      rows.push(...(batch as { results: unknown[] }).results);
    }
  }
  return rows;
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

async function main(): Promise<void> {
  const db = argValue("--db");
  if (!db) usage();
  const limit = Math.min(
    Math.max(Number(argValue("--limit") ?? "100") || 100, 1),
    500,
  );
  const dryRun = process.argv.includes("--dry-run");

  const rows = d1Query(
    db,
    `SELECT id, first_name AS firstName, email, language, created_at AS subscribedAt ` +
      `FROM newsletter_subscribers WHERE welcome_email_sent_at IS NULL ` +
      `ORDER BY id LIMIT ${limit}`,
  ) as PendingSubscriber[];

  console.log(`Pending welcome emails: ${rows.length}`);
  if (dryRun) {
    console.log("Dry run: nothing sent, nothing marked.");
    return;
  }

  let welcomed = 0;
  let ownerAlerted = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await sendNewsletterWelcomeEmail({
        firstName: row.firstName,
        email: row.email,
        language: row.language,
      });
      try {
        await sendNewsletterOwnerAlert({
          firstName: row.firstName,
          email: row.email,
          language: row.language,
          subscribedAt: row.subscribedAt,
        });
        ownerAlerted += 1;
      } catch {
        // Owner alert is best-effort: the subscriber is still marked sent.
        console.error(`Owner alert failed (language=${row.language})`);
      }
      d1Query(
        db,
        `UPDATE newsletter_subscribers SET welcome_email_sent_at = ` +
          `strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ${Number(row.id)} ` +
          `AND welcome_email_sent_at IS NULL`,
      );
      welcomed += 1;
    } catch {
      // Welcome delivery failed: row stays pending for the next run.
      console.error(`Welcome email failed (language=${row.language})`);
      failed += 1;
    }
  }

  console.log(
    `Done: welcomed=${welcomed} ownerAlerted=${ownerAlerted} failed=${failed}`,
  );
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
