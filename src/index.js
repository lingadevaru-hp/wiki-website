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
    const speaker = url.searchParams.get("speaker") || "luna";

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing ?text= parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // aura-1 practical limit
    const MAX_CHARS = 2000;
    const truncated = text.slice(0, MAX_CHARS);

    try {
      const resp = await env.AI.run(
        "@cf/deepgram/aura-1",
        { text: truncated, speaker: speaker },
        { returnRawResponse: true }
      );

      return new Response(resp.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          ...cors,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }
  },
};
