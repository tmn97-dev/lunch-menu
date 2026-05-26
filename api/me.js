import { verifySession } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const user = await verifySession(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.status(200).json({ username: user.username });
}
