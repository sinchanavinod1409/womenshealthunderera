import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import type { Request, Response } from "express";
import { createSessionRecord, getUserBySessionHash, removeSession } from "./db";
import type { User } from "../drizzle/schema";

export const SESSION_COOKIE = "women_health_session";
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
const scrypt = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) =>
      error ? reject(error) : resolve(key as Buffer)
    );
  });
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (
    scheme !== "scrypt" ||
    !saltHex ||
    !hashHex ||
    !/^[a-f0-9]{32}$/.test(saltHex) ||
    !/^[a-f0-9]{128}$/.test(hashHex)
  )
    return false;
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(derived, Buffer.from(hashHex, "hex"));
}
export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
function getCookie(req: Request, name: string) {
  const raw = req.headers.cookie ?? "";
  const pair = raw
    .split(";")
    .map(v => v.trim())
    .find(v => v.startsWith(`${name}=`));
  if (!pair) return undefined;
  try {
    return decodeURIComponent(pair.slice(name.length + 1));
  } catch {
    return undefined;
  }
}
export function getRequestSessionToken(req: Request) {
  const auth = req.headers.authorization;
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  return bearer || getCookie(req, SESSION_COOKIE);
}
export async function authenticateRequest(
  req: Request
): Promise<{ user: User | null; tokenHash?: string }> {
  const token = getRequestSessionToken(req);
  if (!token || token.length < 32 || token.length > 256) return { user: null };
  const tokenHash = hashSessionToken(token);
  const user = await getUserBySessionHash(tokenHash);
  return user ? { user, tokenHash } : { user: null, tokenHash };
}
function cookieOptions(maxAge: number, req: Request) {
  // Prefer the public proxy's protocol. Preview is HTTPS even when its upstream hop is HTTP.
  const forwarded = req.headers["x-forwarded-proto"];
  const publicProtocol = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    .trim()
    .toLowerCase();
  let originProtocol: string | undefined;
  try {
    originProtocol = req.headers.origin
      ? new URL(req.headers.origin).protocol
      : undefined;
  } catch {
    /* ignored; the request origin is separately checked */
  }
  const secure = publicProtocol
    ? publicProtocol === "https"
    : originProtocol === "https:" || req.protocol === "https";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge,
  };
}
export async function issueSession(
  userId: number,
  res: Response,
  req: Request,
  remember = false
) {
  const token = randomBytes(32).toString("base64url");
  const ttl = remember ? SESSION_TTL : 12 * 60 * 60 * 1000;
  await createSessionRecord(
    hashSessionToken(token),
    userId,
    new Date(Date.now() + ttl)
  );
  res.cookie(SESSION_COOKIE, token, cookieOptions(ttl, req));
}
export async function revokeSession(
  tokenHash: string | undefined,
  res: Response,
  req: Request
) {
  if (tokenHash) await removeSession(tokenHash);
  const { maxAge: _maxAge, ...options } = cookieOptions(0, req);
  res.clearCookie(SESSION_COOKIE, options);
}
export function meetsPasswordPolicy(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
export function safeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    preferredLanguage: user.preferredLanguage,
  };
}
