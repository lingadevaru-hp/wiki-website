# Backend

## Stack

- **Express 5** — Node.js API server
- **Drizzle ORM** — database queries
- **PostgreSQL** — persistent application data
- **Zod** — request validation
- **Nodemailer** — Zoho SMTP email delivery

## Structure

```
artifacts/api-server/
├── src/
│   ├── index.ts        # Node server entry
│   ├── app.ts          # Express app and middleware
│   ├── routes/         # API route handlers
│   └── services/       # External services (email)
└── .env.example        # Local API configuration template
```

## API Conventions

- REST endpoints under `/api/`
- JSON request/response bodies
- Zod validation on all inputs
- Do not return credentials or provider errors to clients.

## Newsletter signup

`POST /api/newsletter/signup` accepts `{ firstName, email, language }`. The
portfolio Worker stores each email once in the free D1 table
`newsletter_subscribers` (`migrations/0001_newsletter_subscribers.sql`) and
validates the same rules as the Node API (name 1–80 chars, valid email,
one of `en`, `kn`, `hi`, `ja`, `ml`, `ta`, `te`, or `gu`).

The welcome email from `newsletter@lingadevaru.in` is sent later by the
Node email sender once Zoho SMTP credentials exist; until then the D1 row
stays pending (`welcome_email_sent_at IS NULL`). The legacy Express route
in `artifacts/api-server/src/routes/newsletter.ts` (Postgres + immediate
send) remains for that backfill and is used only when the Worker has no
`DB` binding but `NEWSLETTER_API_URL` is set.
