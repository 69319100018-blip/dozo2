/**
 * Webhook รับ event จาก LINE Messaging API
 * ใช้หา userId เมื่อแอดมิน/ทีมกดเพิ่มเพื่อน OA ครั้งแรก
 *
 * ตั้งค่าใน LINE Developers → Messaging API → Webhook URL:
 *   https://your-domain.vercel.app/api/line-webhook
 *
 * ตัวแปรเสริม (แนะนำ):
 *   LINE_CHANNEL_SECRET — ใช้ตรวจลายเซ็น request
 *
 * หลังมีคนเพิ่มเพื่อน OA ให้ดู Vercel Function Logs จะมีบรรทัด:
 *   [LINE] follow userId=Uxxxxxxxx
 * แล้วนำค่านี้ไปใส่ LINE_NOTIFY_TO ใน Environment Variables
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { getLineConfigStatus } from "../lib/line.js";
import { json } from "../lib/server.js";

function verifySignature(rawBody, signature, secret) {
  if (!secret) return true; // ยังไม่ตั้ง secret = ข้ามการตรวจ
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function handler(request) {
  if (request.method === "GET") {
    // เปิดในเบราว์เซอร์เพื่อเช็กว่า webhook ขึ้น และ env พร้อมแค่ไหน (ไม่โชว์ secret)
    const status = getLineConfigStatus();
    return json({
      ok: true,
      service: "dozo-line-webhook",
      line: {
        hasToken: status.hasToken,
        recipientCount: status.recipientCount,
        ready: status.ready,
        hint: status.ready
          ? "พร้อมส่งแจ้งเตือนเมื่อมีออเดอร์ใหม่"
          : "ยังไม่ครบ — ต้องมี LINE_CHANNEL_ACCESS_TOKEN และ LINE_NOTIFY_TO",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") || "";
  const secret = process.env.LINE_CHANNEL_SECRET || "";

  if (secret && !verifySignature(rawBody, signature, secret)) {
    console.error("[LINE] webhook invalid signature");
    return json({ error: "invalid signature" }, 403);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  for (const event of events) {
    const type = event?.type;
    const source = event?.source || {};
    if (type === "follow" && source.userId) {
      // คัดลอกค่านี้ไปใส่ LINE_NOTIFY_TO ใน Vercel
      console.log(`[LINE] follow userId=${source.userId}`);
    } else if (type === "unfollow" && source.userId) {
      console.log(`[LINE] unfollow userId=${source.userId}`);
    } else if (type === "join" && source.groupId) {
      console.log(`[LINE] join groupId=${source.groupId}`);
    } else if (type === "message") {
      if (source.groupId) {
        console.log(`[LINE] message groupId=${source.groupId} userId=${source.userId || "-"}`);
      } else if (source.userId) {
        console.log(`[LINE] message userId=${source.userId}`);
      }
    }
  }

  return json({ ok: true });
}

export const GET = handler;
export const POST = handler;
