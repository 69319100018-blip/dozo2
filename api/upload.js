import { randomUUID } from "node:crypto";
import { get, issueSignedToken, put } from "@vercel/blob";
import { handleUploadPresigned } from "@vercel/blob/client";
import {
  assertSameOrigin,
  errorMessage,
  getSessionUser,
  getSql,
  isPrivateUploadPathForUser,
  json,
  verifyFileViewToken,
} from "../lib/server.js";

// Vercel Blob supports objects up to 5 TB; direct client uploads avoid the
// 4.5 MB request-body limit imposed on Vercel Functions.
const MAX_FILE_SIZE = 5 * 1024 ** 4;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const ALLOWED_PURPOSES = new Set(["slip", "material_screenshot", "map_screenshot"]);

function isValidUploadPath(pathname, user, purpose, contentType) {
  if (typeof pathname !== "string" || pathname.includes("..") || pathname.startsWith("/")) return false;
  const ext = ALLOWED_TYPES.get(contentType);
  if (!ext) return false;

  const filePattern = new RegExp(`^${purpose}-[0-9a-f-]{36}\\.${ext}$`, "i");
  const segments = pathname.split("/");
  if (user) {
    return segments.length === 3 && segments[0] === "orders" && segments[1] === user.id && filePattern.test(segments[2]);
  }
  return segments.length === 4 && segments[0] === "orders" && segments[1] === "guest" &&
    /^[0-9a-f-]{36}$/i.test(segments[2]) && filePattern.test(segments[3]);
}

async function handler(request) {
  try {
    if (request.method === "POST") {
      // อนุญาตอัปโหลดโดยไม่ล็อกอิน (guest)
      const user = await getSessionUser(request);
      if ((request.headers.get("content-type") || "").includes("application/json")) {
        const body = await request.json();

        if (body?.action === "prepare") {
          assertSameOrigin(request);
          const purpose = String(body.purpose || "");
          const contentType = String(body.contentType || "");
          if (!ALLOWED_PURPOSES.has(purpose) || !ALLOWED_TYPES.has(contentType)) {
            return json({ error: "ประเภทไฟล์ภาพไม่ถูกต้อง" }, 400);
          }

          const ownerKey = user?.id || `guest/${randomUUID()}`;
          const pathname = `orders/${ownerKey}/${purpose}-${randomUUID()}.${ALLOWED_TYPES.get(contentType)}`;
          return json({ pathname });
        }

        if (body?.type === "blob.generate-presigned-url") assertSameOrigin(request);
        const result = await handleUploadPresigned({
          body,
          request,
          getSignedToken: async (pathname, clientPayload) => {
            let metadata;
            try {
              metadata = JSON.parse(clientPayload || "{}");
            } catch {
              throw new Error("ข้อมูลไฟล์อัปโหลดไม่ถูกต้อง");
            }
            const purpose = String(metadata.purpose || "");
            const contentType = String(metadata.contentType || "");
            if (!ALLOWED_PURPOSES.has(purpose) || !ALLOWED_TYPES.has(contentType) ||
                !isValidUploadPath(pathname, user, purpose, contentType)) {
              throw new Error("เส้นทางหรือชนิดไฟล์อัปโหลดไม่ถูกต้อง");
            }

            const validUntil = Date.now() + 10 * 60 * 1000;
            const token = await issueSignedToken({
              pathname,
              operations: ["put"],
              allowedContentTypes: [contentType],
              maximumSizeInBytes: MAX_FILE_SIZE,
              validUntil,
            });
            return {
              token,
              urlOptions: {
                allowedContentTypes: [contentType],
                maximumSizeInBytes: MAX_FILE_SIZE,
                validUntil,
                addRandomSuffix: false,
                allowOverwrite: false,
              },
            };
          },
        });
        return json(result);
      }

      assertSameOrigin(request);
      const form = await request.formData();
      const file = form.get("file");
      const purpose = String(form.get("purpose") || "");

      if (!file || typeof file.arrayBuffer !== "function") {
        return json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, 400);
      }
      if (!ALLOWED_PURPOSES.has(purpose)) {
        return json({ error: "ประเภทไฟล์ไม่ถูกต้อง" }, 400);
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        return json({ error: "รองรับเฉพาะ JPG, PNG และ WEBP" }, 400);
      }
      if (file.size <= 0 || file.size > 3 * 1024 * 1024) {
        return json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 3 MB" }, 400);
      }

      const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const isJpeg = signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
      const isPng = signature.length >= 8 && signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47 && signature[4] === 0x0d && signature[5] === 0x0a && signature[6] === 0x1a && signature[7] === 0x0a;
      const isWebp = signature.length >= 12 && String.fromCharCode(...signature.slice(0, 4)) === "RIFF" && String.fromCharCode(...signature.slice(8, 12)) === "WEBP";
      const detectedType = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : null;
      if (!detectedType || detectedType !== file.type) {
        return json({ error: "ชนิดไฟล์ภาพไม่ถูกต้อง" }, 400);
      }

      const ext = ALLOWED_TYPES.get(detectedType);
      const ownerKey = user?.id || `guest/${randomUUID()}`;
      const pathname = `orders/${ownerKey}/${purpose}-${randomUUID()}.${ext}`;
      const blob = await put(pathname, file, {
        access: "private",
        addRandomSuffix: false,
        contentType: detectedType,
        cacheControlMaxAge: 60,
      });
      return json({ success: true, pathname: blob.pathname, size: file.size, contentType: detectedType }, 201);
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      const pathname = url.searchParams.get("pathname");
      const viewToken = url.searchParams.get("token");
      if (!pathname || pathname.includes("..") || pathname.startsWith("/")) {
        return json({ error: "ไม่พบไฟล์" }, 400);
      }

      // ลิงก์จากแจ้งเตือน Discord/LINE (โทเคนชั่วคราว — เฉพาะไฟล์แนบ ไม่ใช่สลิป)
      const tokenOk = Boolean(viewToken && verifyFileViewToken(pathname, viewToken));

      if (!tokenOk) {
        const user = await getSessionUser(request);
        if (!user) return json({ error: "กรุณาเข้าสู่ระบบก่อน" }, 401);

        const sql = getSql();
        let access;
        if (user.role === "admin") {
          [access] = await sql`
            SELECT id FROM orders
            WHERE slip_path = ${pathname} OR attachment_path = ${pathname}
            LIMIT 1
          `;
        } else if (user.role === "staff") {
          // ลูกทีมดูไฟล์ได้เฉพาะงานที่ถูกส่งมอบให้ตัวเอง
          [access] = await sql`
            SELECT id FROM orders
            WHERE assigned_staff_id = ${user.id}
              AND (slip_path = ${pathname} OR attachment_path = ${pathname})
            LIMIT 1
          `;
        } else {
          [access] = await sql`
            SELECT id FROM orders
            WHERE customer_id = ${user.id}
              AND (slip_path = ${pathname} OR attachment_path = ${pathname})
            LIMIT 1
          `;
        }
        if (!access) return json({ error: "ไม่มีสิทธิ์ดูไฟล์นี้" }, 403);
      }

      const blob = await get(pathname, { access: "private" });
      if (!blob || blob.statusCode !== 200 || !blob.stream) return json({ error: "ไม่พบไฟล์" }, 404);
      return new Response(blob.stream, {
        status: 200,
        headers: {
          "Content-Type": blob.blob.contentType || "application/octet-stream",
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store",
        },
      });
    }

    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
  } catch (error) {
    return json({ error: errorMessage(error, "ไม่สามารถจัดการไฟล์ได้") }, error.status || 500);
  }
}

export const GET = handler;
export const POST = handler;
