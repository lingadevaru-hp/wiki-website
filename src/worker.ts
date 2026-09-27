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
  NEWSLETTER_API_URL?: string;
  NEWSLETTER_PROXY_TOKEN?: string;
  /** Cloudflare D1, free storage for newsletter signups. See migrations/. */
  DB?: D1Database;
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
 * Free storage path: newsletter signups live in Cloudflare D1, so no paid
 * Postgres or separately hosted Node API is needed to collect subscribers.
 * The welcome email is sent later by the Node email sender once Zoho SMTP
 * credentials exist; until then the row stays pending
 * (welcome_email_sent_at IS NULL). Never logs names or emails.
 */
async function handleNewsletterSignupD1(
  request: Request,
  db: D1Database,
): Promise<Response> {
  let body: { firstName?: unknown; email?: unknown; language?: unknown };
  try {
    body = await request.json();
  } catch {
    return newsletterJson(
      {
        error:
          "Enter a valid first name, email address, and supported language.",
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

  if (
    !firstName ||
    firstName.length > 80 ||
    /[\r\n\0]/.test(firstName) ||
    !email ||
    email.length > 254 ||
    !/.+@.+\..+/.test(email) ||
    !isNewsletterLanguage(language)
  ) {
    return newsletterJson(
      {
        error:
          "Enter a valid first name, email address, and supported language.",
      },
      400,
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

  return newsletterJson(
    { message: "Thanks for subscribing. Your welcome email is on its way." },
    200,
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
        return handleNewsletterSignupD1(request, env.DB);
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
