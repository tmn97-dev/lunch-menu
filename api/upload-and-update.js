/**
 * POST /api/upload-and-update
 * Auth: requires valid session cookie.
 * Body: JSON { image: "data:image/jpeg;base64,..." }
 * Flow: Gemini Vision extracts menu JSON → store latest row in Turso `menus`.
 * Env: GEMINI_API_KEY, TURSO_URL, TURSO_AUTH_TOKEN, SESSION_SECRET.
 */

import { db } from "./_lib/db.js";
import { verifySession } from "./_lib/auth.js";

const SYSTEM_PROMPT = `You are a precise assistant. You extract a weekly lunch menu from a photo and return ONLY valid JSON, no markdown or explanation.
Rules:
- Use Norwegian day names: Mandag, Tirsdag, Onsdag, Torsdag, Fredag.
- Dates must be YYYY-MM-DD for the correct week.
- week: ISO week like 2026-W09.
- lastUpdated: use today's date in YYYY-MM-DD.
- Each day has items with: name, description (optional), tags (array, e.g. vegetar, fisk, suppe, svin), price (string, can be ""), and allergies (array of strings).
- For each dish, infer allergies/allergens from the dish name and description (ingredients). Use Norwegian or standard terms, e.g.: gluten, melk, egg, nøtter, mandler, sesam, skalldyr, fisk, soya, sennep, selleri, lupin. Only include allergies you can reasonably infer from the text; use an empty array [] if none are evident.
- Return exactly the JSON object, no code block or extra text.`;

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const user = await verifySession(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    res.status(500).json({ error: "Server misconfigured: GEMINI_API_KEY required" });
    return;
  }

  const dataUrl = req.body?.image;
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
    res.status(400).json({ error: "Body must include image (data URL)" });
    return;
  }

  let menuJson;
  try {
    const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
    const mimeType = match ? match[1] : "image/jpeg";
    const base64Data = match ? match[2] : dataUrl.replace(/^data:image\/\w+;base64,/, "");

    const userPrompt =
      "Extract the weekly lunch menu from this image. Return only valid JSON matching the schema (week, restaurant, hours, lastUpdated, days with day/date/items). Use Norwegian. Today's date for lastUpdated: " +
      new Date().toISOString().slice(0, 10);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Data } },
                { text: userPrompt },
              ],
            },
          ],
          generation_config: { max_output_tokens: 4096 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      res.status(502).json({ error: "AI request failed", detail: errText.slice(0, 300) });
      return;
    }

    const geminiData = await geminiRes.json();
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!raw) {
      const errDetail = geminiData.error?.message || JSON.stringify(geminiData).slice(0, 200);
      res.status(502).json({ error: "Empty AI response", detail: errDetail });
      return;
    }

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```\s*$/, "").trim();
    menuJson = JSON.parse(cleaned);
  } catch (e) {
    res.status(502).json({ error: "AI parse failed", detail: e.message });
    return;
  }

  if (!menuJson.lastUpdated) {
    menuJson.lastUpdated = new Date().toISOString().slice(0, 10);
  }

  await db().execute({
    sql: "INSERT INTO menus (data, uploaded_by) VALUES (?, ?)",
    args: [JSON.stringify(menuJson), user.id],
  });

  res.status(200).json({ success: true, menu: menuJson });
}
