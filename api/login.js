import bcrypt from "bcryptjs";
import { db } from "./_lib/db.js";
import { createSessionToken, sessionCookie } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "username and password required" });
    return;
  }

  const result = await db().execute({
    sql: "SELECT id, username, password_hash FROM users WHERE username = ?",
    args: [username],
  });
  const user = result.rows[0];

  // Run bcrypt even on missing user to avoid trivial timing leaks.
  const ok = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, "$2a$12$invalidsaltinvalidsaltinvOQRu0xMR/B3T0nXp2GnE1WgRzG8DAS6");

  if (!user || !ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = await createSessionToken({ id: user.id, username: user.username });
  res.setHeader("Set-Cookie", sessionCookie(token));
  res.status(200).json({ username: user.username });
}
