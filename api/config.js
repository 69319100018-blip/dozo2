import { json } from "../lib/server.js";

/**
 * ค่าคอนฟิกสาธารณะสำหรับฝั่งเว็บ
 * - promptPayId: เบอร์/เลขบัตรที่ใช้สร้าง QR (ไม่ใช่ความลับ — QR เดิมก็เผยอยู่แล้ว)
 */
async function handler(request) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const promptPayId = String(process.env.PROMPTPAY_ID || "").trim();
  const promptPayName = String(process.env.PROMPTPAY_NAME || "Dozo Genshin").trim();

  return json({
    promptPayId: promptPayId || null,
    promptPayName,
    hasPromptPay: Boolean(promptPayId),
  });
}

export const GET = handler;
