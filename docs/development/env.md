# Environment Variables

## Newsletter storage (free)

Newsletter signups need no environment variables: the portfolio Worker
stores them in its `DB` (Cloudflare D1) binding. Create the database with
`wrangler d1 create wiki-newsletter` and put the ID in `wrangler.jsonc`.

## API server (legacy Node path + future email backfill)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `ZOHO_SMTP_USER` | Zoho mailbox used for SMTP authentication | Required |
| `ZOHO_SMTP_PASSWORD` | Zoho app-specific password; never use or commit the account password | Required |
| `NEWSLETTER_PROXY_TOKEN` | Shared secret restricting the API to the portfolio Worker | Required in production |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `ZOHO_SMTP_HOST` | Regional Zoho SMTP host | `smtp.zoho.in` |
| `ZOHO_SMTP_PORT` | Zoho SMTP port | `465` |

Copy `artifacts/api-server/.env.example` to `artifacts/api-server/.env` and
fill in local values. Create an app-specific password in Zoho Accounts under
**Security → App Passwords** (enable multi-factor authentication if Zoho
requires it); use that value for `ZOHO_SMTP_PASSWORD`, not your normal login
password. `.env` files are ignored by Git.

## Portfolio Worker

| Variable | Description |
|----------|-------------|
| `NEWSLETTER_API_URL` | HTTPS origin of the separately hosted Node API server |
| `NEWSLETTER_PROXY_TOKEN` | Secret shared with the Node API to authenticate proxied signup requests |

Set `NEWSLETTER_API_URL` in the Cloudflare Worker environment. The Worker uses
it to proxy newsletter signups; it is not included in frontend assets. Set
`NEWSLETTER_PROXY_TOKEN` as a Worker secret and the same value as a private
environment variable on the Node API host. Set database and Zoho credentials
only on the Node API host, never in the frontend or Worker.

Zoho's regional SMTP hostname can differ. Use the hostname for the mailbox's
data center if it is not `smtp.zoho.in`. Keep the sender address fixed as
`newsletter@lingadevaru.in`, and ensure that address is a mailbox or permitted
alias on the Zoho account.
