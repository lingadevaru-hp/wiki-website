export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    const text = url.searchParams.get("text") || "";
    const lang = url.searchParams.get("lang") || "en";
    if (!text) {
      return new Response(JSON.stringify({ error: "Missing ?text= parameter" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors }
      });
    }
    const truncated = text.slice(0, 3000);
    try {
      const audio = await env.AI.run("@cf/myshell-ai/melotts", { prompt: truncated, lang });
      return new Response(audio, {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400", ...cors }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors }
      });
    }
  },
};
