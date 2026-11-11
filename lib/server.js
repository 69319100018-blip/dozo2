import { neon } from "@neondatabase/serverless";
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
let sqlClient;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in Vercel Environment Variables.");
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export function errorMessage(error, fallback = "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์") {
  console.error(error);
  return fallback;
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    const error = new Error("คำขอไม่ผ่านการตรวจสอบต้นทาง");
    error.status = 403;
    throw error;
  }
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters.");
  }
  return secret;
}

function signSession(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySession(token) {
  if (!token || typeof token !== "string") return null;
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return null;

  const expected = createHmac("sha256", sessionSecret()).update(encoded).digest();
  let supplied;
  try {
    supplied = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

export function buildSessionCookie(userId) {
  const expiresIn = 60 * 60 * 24 * 7;
  const token = signSession({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  });
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `dozo_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${expiresIn}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `dozo_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export async function getSessionUser(request) {
  const token = readCookie(request, "dozo_session");
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload) return null;

  const sql = getSql();
  const [user] = await sql`
    SELECT id::text AS id, email, display_name AS "displayName", role
    FROM users
    WHERE id = ${payload.sub}
    LIMIT 1
  `;
  return user || null;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isPrivateUploadPathForUser(pathname, userId) {
  return typeof pathname === "string" &&
    pathname.startsWith(`orders/${userId}/`) &&
    !pathname.includes("..") &&
    !pathname.startsWith("/");
}

/** ไฟล์อัปโหลดจากผู้ใช้ที่ไม่ล็อกอิน */
export function isGuestUploadPath(pathname) {
  return typeof pathname === "string" &&
    pathname.startsWith("orders/guest/") &&
    !pathname.includes("..") &&
    !pathname.startsWith("/") &&
    pathname.split("/").length >= 3;
}

export function isValidOrderUploadPath(pathname, userId) {
  if (userId && isPrivateUploadPathForUser(pathname, userId)) return true;
  return isGuestUploadPath(pathname);
}

/** โทเคนดูไฟล์แนบชั่วคราว (ใช้ในแจ้งเตือน Discord/LINE) — ไม่ใช้กับสลิปโอนเงิน */
export function createFileViewToken(pathname, ttlSeconds = 60 * 60 * 24 * 7) {
  if (!pathname || typeof pathname !== "string" || pathname.includes("..") || pathname.startsWith("/")) {
    return null;
  }
  // อนุญาตเฉพาะไฟล์แนบงาน ไม่ใช่สลิป
  if (!/(map_screenshot|material_screenshot)/.test(pathname)) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const encoded = Buffer.from(JSON.stringify({ p: pathname, exp })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyFileViewToken(pathname, token) {
  if (!pathname || !token || typeof token !== "string") return false;
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return false;
  const expected = createHmac("sha256", sessionSecret()).update(encoded).digest();
  let supplied;
  try {
    supplied = Buffer.from(suppliedSignature, "base64url");
  } catch {
    return false;
  }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload?.p || payload.p !== pathname) return false;
    if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) return false;
    if (pathname.includes("..") || pathname.startsWith("/")) return false;
    if (!/(map_screenshot|material_screenshot)/.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function publicBaseUrl(request) {
  const fromEnv = String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = String(process.env.VERCEL_URL || "").trim().replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

export function buildAttachmentViewUrl(request, pathname) {
  if (!pathname) return null;
  const token = createFileViewToken(pathname);
  if (!token) return null;
  const base = publicBaseUrl(request);
  if (!base) return null;
  return `${base}/api/upload?pathname=${encodeURIComponent(pathname)}&token=${encodeURIComponent(token)}`;
}
