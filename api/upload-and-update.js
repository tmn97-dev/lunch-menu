/**
 * Vercel serverless API: upload menu image → AI interprets → commit & push to GitHub.
 * POST body: JSON { image: "data:image/jpeg;base64,..." }
 * Env: GEMINI_API_KEY, GITHUB_TOKEN, GITHUB_REPO (e.g. "owner/repo")
 * Uses Google Gemini (free tier) for vision.
 */

const SYSTEM_PROMPT = `You are a precise assistant. You extract a weekly lunch menu from a photo and return ONLY valid JSON, no markdown or explanation.
Rules:
- Use Norwegian day names: Mandag, Tirsdag, Onsdag, Torsdag, Fredag.
- Dates must be YYYY-MM-DD for the correct week.
- week: ISO week like 2026-W09.
- lastUpdated: use today's date in YYYY-MM-DD.
- Each day has items: name, description (optional), tags (array, e.g. vegetarian, fisk, suppe, svin), price (string, can be "").
- Return exactly the JSON object, no code block or extra text.`;

function corsHeaders(origin) {
  const allow = origin || "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  console.logs("Received request", { method: req.method, origin, geminiKey: !!geminiKey, githubToken: !!githubToken, githubRepo });

  if (!geminiKey || !githubToken || !githubRepo) {
    res.writeHead(500, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "Server misconfigured: GEMINI_API_KEY, GITHUB_TOKEN, GITHUB_REPO required",
    }));
    return;
  }

  let body;
  try {
    body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => { data += chunk; });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
    body = JSON.parse(body || "{}");
  } catch (e) {
    res.writeHead(400, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  const dataUrl = body.image;
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    res.writeHead(400, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Body must include image (data URL)" }));
    return;
  }

  // 1) Google Gemini Vision: image → menu JSON (free tier)
  let menuJson;
  try {
    const dataUrlMatch = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
    const mimeType = dataUrlMatch ? dataUrlMatch[1] : "image/jpeg";
    const base64Data = dataUrlMatch ? dataUrlMatch[2] : dataUrl.replace(/^data:image\/\w+;base64,/, "");

    const userPrompt = "Extract the weekly lunch menu from this image. Return only valid JSON matching the schema (week, restaurant, hours, lastUpdated, days with day/date/items). Use Norwegian. Today's date for lastUpdated: " + new Date().toISOString().slice(0, 10);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Data } },
              { text: userPrompt },
            ],
          }],
          generation_config: { max_output_tokens: 4096 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      res.writeHead(502, { ...corsHeaders(origin), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "AI request failed", detail: errText.slice(0, 300) }));
      return;
    }

    const geminiData = await geminiRes.json();
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) {
      const errDetail = geminiData.error?.message || JSON.stringify(geminiData).slice(0, 200);
      res.writeHead(502, { ...corsHeaders(origin), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Empty AI response", detail: errDetail }));
      return;
    }

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "").trim();
    menuJson = JSON.parse(cleaned);
  } catch (e) {
    res.writeHead(502, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "AI parse failed", detail: e.message }));
    return;
  }

  // Ensure lastUpdated
  if (!menuJson.lastUpdated) {
    menuJson.lastUpdated = new Date().toISOString().slice(0, 10);
  }

  const newContent = Buffer.from(JSON.stringify(menuJson, null, 2), "utf8").toString("base64");

  // 2) GitHub: get current file (for sha), then update
  const [owner, repo] = githubRepo.split("/").filter(Boolean);
  if (!owner || !repo) {
    res.writeHead(500, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid GITHUB_REPO (use owner/repo)" }));
    return;
  }

  const ghOpt = {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${githubToken}`,
    },
  };

  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/menu.json`;
  const getRes = await fetch(getUrl, ghOpt);
  let sha = null;
  if (getRes.ok) {
    const file = await getRes.json();
    sha = file.sha;
  }

  const putRes = await fetch(getUrl, {
    method: "PUT",
    headers: {
      ...ghOpt.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update menu from upload",
      content: newContent,
      sha: sha || undefined,
      branch: "main",
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    res.writeHead(502, { ...corsHeaders(origin), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "GitHub update failed", detail: errText.slice(0, 300) }));
    return;
  }

  res.writeHead(200, { ...corsHeaders(origin), "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, message: "Menu updated and pushed" }));
}
