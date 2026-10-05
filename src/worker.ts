import {
  ownerNotifyEmails,
  sendWelcomeAndAlert,
  smtpConfigured,
} from "./worker-email";
import { decoyResponse, isDecoyMode } from "./decoy";

const GATE_HTML = (sitekey: string, returnTo: string, lang = "en") => `<!DOCTYPE html>
<html lang="${lang}" translate="no" class="notranslate">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google" content="notranslate">
  <title>Security Verification</title>
  <link rel="preconnect" href="https://challenges.cloudflare.com" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; background: #0a0f1e; color: #e2e8f0; padding: 1.5rem; }
    .gate { text-align: center; max-width: 440px; width: 100%; }
    .gate-mark { width: 46px; height: 46px; margin: 0 auto 1.5rem; display: grid; place-items: center; border: 1px solid #475569; border-radius: 50%; color: #dbeafe; font-size: 1.1rem; }
    .tagline { font-size: 0.95rem; color: #94a3b8; margin-bottom: 1.5rem; }
    .cf-turnstile { display: flex; justify-content: center; margin: 0 auto; min-height: 65px; }
    #err { color: #f87171; font-size: 0.8rem; margin-top: 0.5rem; display: none; }
  </style>
</head>
<body>
  <div class="gate">
    <div class="gate-mark" aria-hidden="true">✓</div>
    <p class="tagline">Cloudflare Turnstile is checking this connection. This lightweight check helps protect the site and expires after 30 seconds.</p>
    <form id="verify-form" method="POST" action="/__turnstile_verify">
      <div class="cf-turnstile" data-sitekey="${sitekey}" data-theme="dark" data-callback="onVerify" data-error-callback="onError" data-appearance="always"></div>
      <input type="hidden" name="return_to" value="${returnTo}">
    </form>
    <p id="err"></p>
  </div>
  <script>
    function onVerify(token) {
      var form = document.getElementById("verify-form");
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "cf-turnstile-response";
      input.value = token;
      form.appendChild(input);
      form.submit();
    }
    function onError(code) {
      var err = document.getElementById("err");
      err.style.display = "block";
      err.textContent = "Verification error (" + code + "). Refresh to try again.";
    }
  </script>
</body>
</html>`;

const HTML_HEADERS = (hostname = ""): Record<string, string> => ({
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  ...(hostname ? { "Content-Language": contentLanguageFor(hostname) } : {}),
});

interface Env {
  AI: Ai;
  ASSETS: { fetch(request: Request): Promise<Response> };
  TURNSTILE_SITEKEY: string;
  TURNSTILE_SECRET: string;
  /** "1" = serve decoy single page for all public traffic (indefinite). */
  DECOY_MODE?: string;
  NEWSLETTER_API_URL?: string;
  NEWSLETTER_PROXY_TOKEN?: string;
  /** Cloudflare D1, free storage for newsletter signups. See migrations/. */
  DB?: D1Database;
  /** Zoho SMTP for instant welcome emails from the Worker (cron is fallback). */
  ZOHO_SMTP_HOST?: string;
  ZOHO_SMTP_PORT?: string;
  ZOHO_SMTP_USER?: string;
  ZOHO_SMTP_PASSWORD?: string;
  NEWSLETTER_OWNER_EMAILS?: string;
}

/** Minimal execution context: only waitUntil is used (instant email send). */
interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

const TTS_MODEL = "@cf/deepgram/aura-1";
const MAX_TTS_CHARS = 2000;

function getCookie(cookies: string, name: string): string | null {
  const match = cookies.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? match[1] : null;
}

async function handleTextToSpeech(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!env.AI) {
    return new Response(
      JSON.stringify({ error: "Workers AI binding is not configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let payload: { text?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Expected JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text =
    typeof payload.text === "string"
      ? payload.text.replace(/\s+/g, " ").trim()
      : "";
  if (!text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const truncated = text.slice(0, MAX_TTS_CHARS);

  try {
    const result = await env.AI.run(TTS_MODEL, { text: truncated, speaker: "luna" }, { returnRawResponse: true });

    const headers = {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    };

    if (result instanceof Response) {
      const responseHeaders = new Headers(result.headers);
      Object.entries(headers).forEach(([key, value]) =>
        responseHeaders.set(key, value),
      );
      return new Response(result.body, {
        status: result.status,
        headers: responseHeaders,
      });
    }

    if (
      result instanceof ReadableStream ||
      result instanceof ArrayBuffer ||
      result instanceof Blob
    ) {
      return new Response(result, { headers });
    }

    // If it's a ReadableStream from returnRawResponse
    if (result.body) {
      return new Response(result.body, { headers });
    }

    return new Response(JSON.stringify({ error: "Unexpected TTS response" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Text-to-speech generation failed",
        detail: error instanceof Error ? error.message : String(error),
        model: TTS_MODEL,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/** Content language per host: parent + locale subdomains (reusable — add host here). */
function contentLanguageFor(hostname: string): string {
  if (hostname === "kn.lingadevaru.in" || hostname.startsWith("kn.")) return "kn";
  if (hostname === "hi.lingadevaru.in" || hostname.startsWith("hi.")) return "hi";
  if (hostname === "ja.lingadevaru.in" || hostname.startsWith("ja.")) return "ja";
  if (hostname === "ml.lingadevaru.in" || hostname.startsWith("ml.")) return "ml";
  if (hostname === "ta.lingadevaru.in" || hostname.startsWith("ta.")) return "ta";
  if (hostname === "te.lingadevaru.in" || hostname.startsWith("te.")) return "te";
  if (hostname === "gu.lingadevaru.in" || hostname.startsWith("gu.")) return "gu";
  return "en";
}

function addSecurityHeaders(response: Response, hostname = ""): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Robots-Tag", "noarchive, nosnippet, noimageindex, noai");
  newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  newHeaders.set("Pragma", "no-cache");
  if (hostname) newHeaders.set("Content-Language", contentLanguageFor(hostname));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Rewrite served HTML so the declared language matches the host:
 * <html lang="kn|hi|en"> + translate="no" + notranslate preserved.
 * Reusable: add a host to contentLanguageFor() and this follows.
 * Only touches text/html responses; assets pass through untouched.
 */
function withLocaleHtml(response: Response, hostname: string): Response {
  const type = response.headers.get("Content-Type") || "";
  if (!type.includes("text/html")) return response;
  const lang = contentLanguageFor(hostname);
  try {
    return new HTMLRewriter()
      .on("html", {
        element(e) {
          e.setAttribute("lang", lang);
          e.setAttribute("translate", "no");
          const cls = e.getAttribute("class") || "";
          if (!cls.split(/\s+/).includes("notranslate")) {
            e.setAttribute("class", (cls ? cls + " " : "") + "notranslate");
          }
        },
      })
      .transform(response);
  } catch {
    return response;
  }
}

const NEWSLETTER_LANGUAGES = [
  "en",
  "kn",
  "hi",
  "ja",
  "ml",
  "ta",
  "te",
  "gu",
] as const;

function isNewsletterLanguage(
  value: unknown,
): value is (typeof NEWSLETTER_LANGUAGES)[number] {
  return (
    typeof value === "string" &&
    (NEWSLETTER_LANGUAGES as readonly string[]).includes(value)
  );
}

function newsletterJson(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Instant primary email path (see handleNewsletterSignupD1): fire the
 * welcome email + owner alert in the background if this address still
 * needs one. Rows already marked sent are skipped; failures stay pending
 * for the cron fallback.
 */
function fireInstantWelcome(
  db: D1Database,
  env: Env,
  ctx: WorkerContext,
  sub: { firstName: string; email: string; language: string },
): void {
  if (!smtpConfigured(env)) return;
  ctx.waitUntil(
    (async () => {
      let needsEmail = false;
      try {
        const existing = await db
          .prepare(
            "SELECT welcome_email_sent_at AS sentAt FROM newsletter_subscribers WHERE email = ?",
          )
          .bind(sub.email)
          .first<{ sentAt: string | null }>();
        needsEmail = !existing || existing.sentAt === null;
      } catch {
        // SELECT failed: attempt the send anyway; worst case the cron
        // de-dupes via its still-pending guard.
        needsEmail = true;
      }
      if (!needsEmail) return;

      const port = Number(env.ZOHO_SMTP_PORT || "465");
      const sent = await sendWelcomeAndAlert({
        firstName: sub.firstName,
        email: sub.email,
        language: sub.language,
        smtp: {
          host: env.ZOHO_SMTP_HOST || "smtp.zoho.in",
          port: Number.isInteger(port) && port > 0 ? port : 465,
          user: env.ZOHO_SMTP_USER,
          pass: env.ZOHO_SMTP_PASSWORD,
        },
        ownerEmails: ownerNotifyEmails(env.NEWSLETTER_OWNER_EMAILS),
        subscribedAt: new Date().toISOString(),
      });
      if (!sent) return;

      // Mirror the cron guard: mark sent only if still pending, so a
      // concurrent sender can never double-send.
      try {
        await db
          .prepare(
            "UPDATE newsletter_subscribers SET welcome_email_sent_at = " +
              "strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE email = ? " +
              "AND welcome_email_sent_at IS NULL",
          )
          .bind(sub.email)
          .run();
      } catch {
        console.error("[newsletter] failed to mark welcome sent");
      }
    })(),
  );
}

/**
 * Free storage path: newsletter signups live in Cloudflare D1, so no paid
 * Postgres or separately hosted Node API is needed to collect subscribers.
 *
 * Primary email path: right after the D1 insert, the Worker itself sends
 * the localized welcome email + best-effort owner alert via Zoho SMTP
 * (see worker-email.ts), scheduled with ctx.waitUntil so the visitor gets
 * an instant 200 while delivery runs in the background (seconds, not the
 * 6-hour cron delay). The row is marked sent only after Zoho accepts the
 * welcome; anything still pending is picked up by the GitHub cron fallback
 * (newsletter-backfill.yml). Never logs names or emails.
 *
 * Modes (same validation for all):
 * - "new" (default): INSERT OR IGNORE fresh subscription.
 * - "edit": move one subscription to corrected details (previousEmail
 *   required); old+new name/email appended to newsletter_history.
 * - "again": brand-new subscription row with new details linked to the
 *   previous address in newsletter_history (resubscribe tracking).
 */
async function handleNewsletterSignupD1(
  request: Request,
  db: D1Database,
  env: Env,
  ctx: WorkerContext,
): Promise<Response> {
  let body: {
    firstName?: unknown;
    email?: unknown;
    language?: unknown;
    mode?: unknown;
    previousEmail?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return newsletterJson(
      {
        error:
          "Enter a valid email address and supported language.",
      },
      400,
    );
  }

  const firstName =
    typeof body.firstName === "string" ? body.firstName.trim() : "";
  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  const language = body.language;
  const mode =
    body.mode === "edit" || body.mode === "again" ? body.mode : "new";
  const previousEmail =
    typeof body.previousEmail === "string"
      ? body.previousEmail.trim().toLowerCase()
      : "";

  if (
    firstName.length > 80 ||
    /[\r\n\0]/.test(firstName) ||
    !email ||
    email.length > 254 ||
    !/.+@.+\..+/.test(email) ||
    !isNewsletterLanguage(language) ||
    (mode !== "new" &&
      (!previousEmail ||
        previousEmail.length > 254 ||
        !/.+@.+\..+/.test(previousEmail)))
  ) {
    return newsletterJson(
      {
        error:
          "Enter a valid email address and supported language.",
      },
      400,
    );
  }

  // Edit: move one subscription to corrected details, keeping history.
  if (mode === "edit") {
    try {
      const existing = await db
        .prepare(
          "SELECT first_name AS firstName, email, language FROM newsletter_subscribers WHERE email = ?",
        )
        .bind(previousEmail)
        .first<{ firstName: string; email: string; language: string }>();
      if (!existing) {
        return newsletterJson(
          { error: "No subscription found for the previous email address." },
          404,
        );
      }
      await db
        .prepare(
          "UPDATE newsletter_subscribers SET first_name = ?, email = ?, language = ?, " +
            "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE email = ?",
        )
        .bind(firstName, email, language, previousEmail)
        .run();
      await db
        .prepare(
          "INSERT INTO newsletter_history (action, old_email, new_email, old_name, new_name, language) " +
            "VALUES ('edit', ?, ?, ?, ?, ?)",
        )
        .bind(previousEmail, email, existing.firstName, firstName, language)
        .run();
      // Corrected address never welcomed before: confirm it instantly.
      if (email !== previousEmail) {
        fireInstantWelcome(db, env, ctx, { firstName, email, language });
      }
    } catch {
      return newsletterJson(
        { error: "We could not update your subscription. Please try again." },
        500,
      );
    }
    return newsletterJson(
      {
        message:
          "Your subscription details are updated. Both the old and new details are kept on record.",
        edited: true,
      },
      200,
    );
  }

  // Resubscribe with new details: a second row linked to the previous one.
  if (mode === "again") {
    try {
      const insert = await db
        .prepare(
          "INSERT OR IGNORE INTO newsletter_subscribers (first_name, email, language) VALUES (?, ?, ?)",
        )
        .bind(firstName, email, language)
        .run();
      const inserted =
        (insert.meta as unknown as { changes?: number } | undefined)
          ?.changes === 1;
      if (!inserted) {
        return newsletterJson(
          {
            message: "This email address is already on the list.",
            duplicate: true,
          },
          200,
        );
      }
      await db
        .prepare(
          "INSERT INTO newsletter_history (action, old_email, new_email, old_name, new_name, language) " +
            "VALUES ('resubscribe', ?, ?, NULL, ?, ?)",
        )
        .bind(previousEmail, email, firstName, language)
        .run();
      fireInstantWelcome(db, env, ctx, { firstName, email, language });
    } catch {
      return newsletterJson(
        { error: "We could not complete your subscription. Please try again." },
        500,
      );
    }
    return newsletterJson(
      {
        message:
          "Thanks for subscribing. Your welcome email is on its way.",
        resubscribed: true,
      },
      200,
    );
  }

  try {
    await db
      .prepare(
        "INSERT OR IGNORE INTO newsletter_subscribers (first_name, email, language) VALUES (?, ?, ?)",
      )
      .bind(firstName, email, language)
      .run();
  } catch {
    return newsletterJson(
      { error: "We could not complete your subscription. Please try again." },
      500,
    );
  }

  // Instant primary path: fire the welcome email + owner alert in the
  // background if this address still needs one (covers brand-new rows and
  // any row a previous attempt missed). Rows already marked sent are
  // skipped; failures stay pending for the cron fallback.
  fireInstantWelcome(db, env, ctx, { firstName, email, language });

  return newsletterJson(
    { message: "Thanks for subscribing. Your welcome email is on its way." },
    200,
  );
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: WorkerContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Decoy mode (indefinite until owner says back): every public request
    // gets the plain single page with 503. Must run BEFORE static bypass,
    // APIs, and bot bypasses, or portfolio JSON/assets would still leak.
    // Kept live: /robots.txt + /sitemap.xml (SEO map) and owner-only
    // newsletter exports with a valid proxy token (curl only, never linked).
    if (isDecoyMode(env)) {
      if (
        url.pathname === "/api/newsletter/subscribers" ||
        url.pathname === "/api/newsletter/history"
      ) {
        if (
          env.NEWSLETTER_PROXY_TOKEN &&
          request.headers.get("X-Newsletter-Proxy-Token") ===
            env.NEWSLETTER_PROXY_TOKEN
        ) {
          // Fall through to the real handlers below (owner export).
        } else {
          return decoyResponse();
        }
      } else if (
        url.pathname !== "/robots.txt" &&
        url.pathname !== "/sitemap.xml"
      ) {
        return decoyResponse();
      }
      // robots.txt / sitemap.xml / authed owner exports fall through.
    }

    // Private owner endpoint: list subscribers as JSON or CSV. Guarded by
    // the shared proxy token header — never linked from the site, curl only.
    if (
      url.pathname === "/api/newsletter/subscribers" &&
      request.method === "GET"
    ) {
      if (!env.DB || !env.NEWSLETTER_PROXY_TOKEN) {
        return newsletterJson(
          { error: "Newsletter service is not configured" },
          503,
        );
      }
      if (
        request.headers.get("X-Newsletter-Proxy-Token") !==
        env.NEWSLETTER_PROXY_TOKEN
      ) {
        return newsletterJson({ error: "Forbidden" }, 403);
      }
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit") ?? "100") || 100, 1),
        500,
      );
      const offset = Math.max(
        Number(url.searchParams.get("offset") ?? "0") || 0,
        0,
      );
      try {
        const result = await env.DB.prepare(
          "SELECT first_name AS firstName, email, language, created_at AS subscribedAt, " +
            "updated_at AS updatedAt, " +
            "welcome_email_sent_at AS welcomeEmailSentAt FROM newsletter_subscribers " +
            "ORDER BY id DESC LIMIT ? OFFSET ?",
        )
          .bind(limit, offset)
          .all();
        const rows = (result.results ?? []) as Record<string, unknown>[];
        if (url.searchParams.get("format") === "csv") {
          const quote = (value: unknown): string =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;
          const header =
            "firstName,email,language,subscribedAt,updatedAt,welcomeEmailSentAt";
          const lines = rows.map((row) =>
            [
              quote(row.firstName),
              quote(row.email),
              quote(row.language),
              quote(row.subscribedAt),
              quote(row.updatedAt),
              quote(row.welcomeEmailSentAt),
            ].join(","),
          );
          return new Response([header, ...lines].join("\n") + "\n", {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Cache-Control": "no-store",
              "Content-Disposition":
                'attachment; filename="newsletter-subscribers.csv"',
            },
          });
        }
        return newsletterJson({ subscribers: rows }, 200);
      } catch {
        return newsletterJson(
          { error: "We could not load the subscribers. Please try again." },
          500,
        );
      }
    }

    // Private owner endpoint: edit/resubscribe history (old+new details per
    // change) as JSON or CSV. Same proxy-token guard, curl only.
    if (
      url.pathname === "/api/newsletter/history" &&
      request.method === "GET"
    ) {
      if (!env.DB || !env.NEWSLETTER_PROXY_TOKEN) {
        return newsletterJson(
          { error: "Newsletter service is not configured" },
          503,
        );
      }
      if (
        request.headers.get("X-Newsletter-Proxy-Token") !==
        env.NEWSLETTER_PROXY_TOKEN
      ) {
        return newsletterJson({ error: "Forbidden" }, 403);
      }
      const limit = Math.min(
        Math.max(Number(url.searchParams.get("limit") ?? "100") || 100, 1),
        500,
      );
      const offset = Math.max(
        Number(url.searchParams.get("offset") ?? "0") || 0,
        0,
      );
      try {
        const result = await env.DB.prepare(
          "SELECT action, old_email AS oldEmail, new_email AS newEmail, " +
            "old_name AS oldName, new_name AS newName, language, " +
            "created_at AS changedAt FROM newsletter_history " +
            "ORDER BY id DESC LIMIT ? OFFSET ?",
        )
          .bind(limit, offset)
          .all();
        const rows = (result.results ?? []) as Record<string, unknown>[];
        if (url.searchParams.get("format") === "csv") {
          const quote = (value: unknown): string =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;
          const header =
            "action,oldEmail,newEmail,oldName,newName,language,changedAt";
          const lines = rows.map((row) =>
            [
              quote(row.action),
              quote(row.oldEmail),
              quote(row.newEmail),
              quote(row.oldName),
              quote(row.newName),
              quote(row.language),
              quote(row.changedAt),
            ].join(","),
          );
          return new Response([header, ...lines].join("\n") + "\n", {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Cache-Control": "no-store",
              "Content-Disposition":
                'attachment; filename="newsletter-history.csv"',
            },
          });
        }
        return newsletterJson({ history: rows }, 200);
      } catch {
        return newsletterJson(
          { error: "We could not load the history. Please try again." },
          500,
        );
      }
    }

    if (url.pathname === "/api/newsletter/signup") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: {
            "Allow": "POST",
            "Content-Type": "application/json",
          },
        });
      }

      const cookies = request.headers.get("Cookie") || "";
      if (getCookie(cookies, "turnstile-verified") !== "true") {
        return newsletterJson({ error: "Verification required" }, 403);
      }

      // Free path: store directly in Cloudflare D1, no Node/Postgres hop.
      if (env.DB) {
        return handleNewsletterSignupD1(request, env.DB, env, ctx);
      }

      // Legacy path: proxy to the separately hosted Node API (paid Postgres).
      if (!env.NEWSLETTER_API_URL) {
        return newsletterJson(
          { error: "Newsletter service is not configured" },
          503,
        );
      }

      if (!env.NEWSLETTER_PROXY_TOKEN) {
        return newsletterJson(
          { error: "Newsletter service is not configured" },
          503,
        );
      }

      try {
        const upstreamUrl = new URL(
          "/api/newsletter/signup",
          env.NEWSLETTER_API_URL,
        );
        const upstream = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type":
              request.headers.get("Content-Type") || "application/json",
            "X-Newsletter-Proxy-Token": env.NEWSLETTER_PROXY_TOKEN,
          },
          body: request.body,
        });
        const headers = new Headers(upstream.headers);
        headers.set("Cache-Control", "no-store");
        return new Response(upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers,
        });
      } catch {
        return newsletterJson(
          { error: "Newsletter service is unavailable" },
          502,
        );
      }
    }

    if (url.pathname === "/api/tts" && request.method === "POST") {
      return handleTextToSpeech(request, env);
    }

    const STATIC_BYPASS_PATHS = ["/robots.txt", "/sitemap.xml", "/favicon.ico", "/opengraph.jpg", "/favicon.svg"];
    if (url.pathname.startsWith("/assets/") || STATIC_BYPASS_PATHS.includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    const cookies = request.headers.get("Cookie") || "";
    const verified = getCookie(cookies, "turnstile-verified") === "true";

    if (verified) {
      const response = await env.ASSETS.fetch(request);
      return withLocaleHtml(addSecurityHeaders(response, url.hostname), url.hostname);
    }

    const ua = request.headers.get("User-Agent") || "";

    const AI_BOT_PATTERN = /gptbot|chatgpt-user|claudebot|claude-ai|anthropic|perplexitybot|bytespider|ccbot|applebot-extended|meta-externalagent|facebookbot|omgili|semrushbot|ahrefsbot|dotbot|yandexbot|dataforseo|petalbot|seekportbot|zoominfobot|bytedance|googleother|youbot|diffbot|cohere-ai|ai2bot|pangubot|perplexity-user|imagesiftbot|archive\.org_bot|ia_archiver|wayback|qwen|baiduspider|sogou|duckassistbot|timpibot|panscient|mj12bot|seznam|piplbot|webzio|google-extended|oai-searchbot|amazonbot/i;
    if (AI_BOT_PATTERN.test(ua)) {
      return new Response(null, { status: 403, statusText: "Forbidden" });
    }

    const SEARCH_BOT_PATTERN = /googlebot|bingbot|duckduckbot|bravesearchbot|slurp|applebot/i;
    if (SEARCH_BOT_PATTERN.test(ua)) {
      const response = await env.ASSETS.fetch(request);
      return withLocaleHtml(addSecurityHeaders(response, url.hostname), url.hostname);
    }

    const SOCIAL_BOT_PATTERN = /facebookexternalhit|twitterbot|linkedinbot|discordbot|telegrambot|whatsapp|slackbot/i;
    if (SOCIAL_BOT_PATTERN.test(ua)) {
      const response = await env.ASSETS.fetch(request);
      return withLocaleHtml(addSecurityHeaders(response, url.hostname), url.hostname);
    }

    const accept = request.headers.get("Accept") || "";
    if (!accept.includes("text/html")) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/__turnstile_verify" && request.method === "POST") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response");
      const returnTo = (formData.get("return_to") as string) || "/";

      const verifyResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: token || "",
          }),
        },
      );
      const result: TurnstileVerifyResponse = await verifyResponse.json();

      if (result.success) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: returnTo,
            "Set-Cookie":
              "turnstile-verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400",
            "Cache-Control": "no-store",
          },
        });
      }
      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, returnTo, contentLanguageFor(url.hostname)), {
        headers: HTML_HEADERS(url.hostname),
      });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, url.pathname, contentLanguageFor(url.hostname)), {
      headers: HTML_HEADERS(url.hostname),
    });
  },
};
