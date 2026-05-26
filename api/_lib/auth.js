import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET must be set");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(user) {
  return new SignJWT({ uid: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { id: payload.uid, username: payload.username };
  } catch {
    return null;
  }
}

export function sessionCookie(token) {
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview";
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(header) {
  if (!header) return {};
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
