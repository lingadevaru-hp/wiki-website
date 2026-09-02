const GATE_HTML = (sitekey: string, returnTo: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
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

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

interface Env {
  AI: Ai;
  ASSETS: { fetch(request: Request): Promise<Response> };
  TURNSTILE_SITEKEY: string;
  TURNSTILE_SECRET: string;
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

function addSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Robots-Tag", "noarchive, nosnippet, noimageindex, noai");
  newHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  newHeaders.set("Pragma", "no-cache");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
      return addSecurityHeaders(response);
    }

    const ua = request.headers.get("User-Agent") || "";

    const AI_BOT_PATTERN = /gptbot|chatgpt-user|claudebot|claude-ai|anthropic|perplexitybot|bytespider|ccbot|applebot-extended|meta-externalagent|facebookbot|omgili|semrushbot|ahrefsbot|dotbot|yandexbot|dataforseo|petalbot|seekportbot|zoominfobot|bytedance/i;
    if (AI_BOT_PATTERN.test(ua)) {
      return new Response(null, { status: 403, statusText: "Forbidden" });
    }

    const SEARCH_BOT_PATTERN = /googlebot|bingbot|duckduckbot|slurp|applebot/i;
    if (SEARCH_BOT_PATTERN.test(ua)) {
      const response = await env.ASSETS.fetch(request);
      return addSecurityHeaders(response);
    }

    const SOCIAL_BOT_PATTERN = /facebookexternalhit|twitterbot|linkedinbot|discordbot|telegrambot|whatsapp|slackbot/i;
    if (SOCIAL_BOT_PATTERN.test(ua)) {
      const response = await env.ASSETS.fetch(request);
      return addSecurityHeaders(response);
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
      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, returnTo), {
        headers: HTML_HEADERS,
      });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, url.pathname), {
      headers: HTML_HEADERS,
    });
  },
};
