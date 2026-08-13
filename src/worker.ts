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
    .gifs-top { display: flex; justify-content: center; gap: 0.75rem; margin-bottom: 1.75rem; }
    .gifs-top img { width: calc(50% - 0.375rem); max-width: 200px; height: 150px; object-fit: cover; border-radius: 10px; }
    .tagline { font-size: 0.95rem; color: #94a3b8; margin-bottom: 1.5rem; }
    .cf-turnstile { display: flex; justify-content: center; margin: 0 auto; min-height: 65px; }
    #err { color: #f87171; font-size: 0.8rem; margin-top: 0.5rem; display: none; }
    .gif-bottom { display: flex; justify-content: center; margin-top: 1.75rem; }
    .gif-bottom img { width: 100%; max-width: 300px; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="gate">
    <div class="gifs-top">
      <img src="https://media.tenor.com/1vepGBkOYsYAAAAM/alaynagifs.gif" alt="" loading="eager" />
      <img src="https://i.pinimg.com/originals/0b/aa/bd/0baabd60a870970ff7cdda4d489075a1.gif" alt="" loading="eager" />
    </div>
    <p class="tagline">Verifying your connection. Please wait...</p>
    <form id="verify-form" method="POST" action="/__turnstile_verify">
      <div class="cf-turnstile" data-sitekey="${sitekey}" data-theme="dark" data-callback="onVerify" data-error-callback="onError" data-appearance="always"></div>
      <input type="hidden" name="return_to" value="${returnTo}">
    </form>
    <p id="err"></p>
    <div class="gif-bottom">
      <img src="https://media0.giphy.com/media/m2Q7FEc0bEr4I/giphy.gif" alt="" loading="eager" />
    </div>
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
  "Cache-Control": "no-store, no-cache, must-revalidate"
};

function getCookie(cookies: string, name: string): string | null {
  const match = cookies.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? match[1] : null;
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const cookies = request.headers.get("Cookie") || "";
    const verified = getCookie(cookies, "turnstile-verified") === "true";

    if (verified) {
      return env.ASSETS.fetch(request);
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
        }
      );
      const result: any = await verifyResponse.json();

      if (result.success) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: returnTo,
            "Set-Cookie": "turnstile-verified=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=30",
            "Cache-Control": "no-store",
          },
        });
      }
      return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, returnTo), { headers: HTML_HEADERS });
    }

    return new Response(GATE_HTML(env.TURNSTILE_SITEKEY, url.pathname), { headers: HTML_HEADERS });
  },
};
