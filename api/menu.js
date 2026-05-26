import { db } from "./_lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const result = await db().execute(
      "SELECT data, created_at FROM menus ORDER BY id DESC LIMIT 1"
    );
    const row = result.rows[0];
    res.setHeader("Cache-Control", "no-store");
    if (!row) {
      res.status(200).json({ days: [], lastUpdated: null });
      return;
    }
    res.status(200).json(JSON.parse(row.data));
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
