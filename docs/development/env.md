# Environment Variables

## Portfolio Worker (production newsletter flow)

The portfolio Worker stores newsletter data in its `DB` (Cloudflare D1)
binding. New signup collection does not require SMTP, but sending welcome
messages and email-change confirmations requires SMTP:

| Setting | Where | Description |
|---------|-------|-------------|
| `ZOHO_SMTP_USER` | Worker variable | Zoho sender mailbox; production uses `newsletter@lingadevaru.in` |
| `ZOHO_SMTP_PASSWORD` | Worker secret | Zoho app-specific password; required for mail delivery |
| `ZOHO_SMTP_HOST` | Worker variable | Regional SMTP host; default is `smtp.zoho.in` |
| `ZOHO_SMTP_PORT` | Worker variable | SMTP port; default is `465` |
| `NEWSLETTER_OWNER_EMAILS` | Worker variable | Comma-separated owner alert recipients; code default is `dev@lingadevaru.in,newsletter@lingadevaru.in` |
| `TURNSTILE_SECRET` | Worker secret | Validates the verification cookie used for signup protection |

The D1 database binding is configured in the root `wrangler.jsonc`. Do not
place SMTP credentials in frontend variables or build output.

## API server (legacy Node path and backfill)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `ZOHO_SMTP_USER` | Zoho mailbox used for SMTP authentication | Required for Node email backfill |
| `ZOHO_SMTP_PASSWORD` | Zoho app-specific password; never use or commit the account password | Required for Node email backfill |
| `NEWSLETTER_PROXY_TOKEN` | Shared secret restricting the API to the portfolio Worker | Required in production |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `ZOHO_SMTP_HOST` | Regional Zoho SMTP host | `smtp.zoho.in` |
| `ZOHO_SMTP_PORT` | Zoho SMTP port | `465` |
| `NEWSLETTER_OWNER_EMAILS` | Comma-separated owner inboxes for "new subscriber" alerts | `dev@lingadevaru.in,newsletter@lingadevaru.in` |

Copy `artifacts/api-server/.env.example` to `artifacts/api-server/.env` and
fill in local values. Create an app-specific password in Zoho Accounts under
**Security → App Passwords** (enable multi-factor authentication if Zoho
requires it); use that value for `ZOHO_SMTP_PASSWORD`, not your normal login
password. `.env` files are ignored by Git.

## Legacy Worker proxy (normally unused)

| Variable | Description |
|----------|-------------|
| `NEWSLETTER_API_URL` | HTTPS origin of the separately hosted Node API server |
| `NEWSLETTER_PROXY_TOKEN` | Secret shared with the Node API to authenticate proxied signup requests |

`NEWSLETTER_API_URL` and `NEWSLETTER_PROXY_TOKEN` are only for the legacy
Node API fallback. In the normal production setup the D1 `DB` binding is
present, so the Worker does not proxy signup requests. The Worker separately
uses its Zoho SMTP credentials to send welcome and email-change messages.

Zoho's regional SMTP hostname can differ. Use the hostname for the mailbox's
data center if it is not `smtp.zoho.in`. Keep the sender address fixed as
`newsletter@lingadevaru.in`, and ensure that address is a mailbox or permitted
alias on the Zoho account. See
[Newsletter email-change confirmation](newsletter-email-changes.md) for how
the existing credentials are used.
