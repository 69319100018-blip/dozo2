/**
 * เช็กสถานะระบบแจ้งเตือน (ไม่โชว์ secret)
 * GET  /api/notify-status          — ดูว่า env พร้อมหรือยัง
 * POST /api/notify-status          — ส่งข้อความทดสอบ (เฉพาะ admin ที่ล็อกอิน)
 */

import { notifyNewOrderDiscord } from "../lib/discord.js";
import { getLineConfigStatus, pushLineText } from "../lib/line.js";
import { assertSameOrigin, getSessionUser, json } from "../lib/server.js";

function discordConfigured() {
  const raw = String(process.env.DISCORD_WEBHOOK_URL || "").trim();
  const urls = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) =>
      s.startsWith("https://discord.com/api/webhooks/") ||
      s.startsWith("https://discordapp.com/api/webhooks/")
    );
  return { hasWebhook: urls.length > 0, webhookCount: urls.length };
}

async function handler(request) {
  const line = getLineConfigStatus();
  const discord = discordConfigured();

  if (request.method === "GET") {
    return json({
      ok: true,
      line: {
        hasToken: line.hasToken,
        recipientCount: line.recipientCount,
        ready: line.ready,
      },
      discord: {
        hasWebhook: discord.hasWebhook,
        webhookCount: discord.webhookCount,
        ready: discord.hasWebhook,
      },
      ready: line.ready || discord.hasWebhook,
      hint: !line.ready && !discord.hasWebhook
        ? "ยังไม่ได้ตั้ง LINE_NOTIFY_TO/TOKEN หรือ DISCORD_WEBHOOK_URL"
        : "มีอย่างน้อย 1 ช่องพร้อม — ใช้ POST (admin) เพื่อทดสอบส่งข้อความ",
    });
  }

  if (request.method === "POST") {
    assertSameOrigin(request);
    const user = await getSessionUser(request);
    if (!user) return json({ error: "กรุณาเข้าสู่ระบบก่อน" }, 401);
    if (user.role !== "admin") return json({ error: "เฉพาะแอดมินเท่านั้น" }, 403);

    const sample = {
      orderNumber: "TEST",
      service: "farm-gem",
      summary: "ข้อความทดสอบจากระบบ Dozo",
      gameUsername: "test-user",
      gameUid: "000000000",
      customerEmail: user.email || "admin@test",
      totalPrice: 0,
    };

    const results = {};

    if (line.ready) {
      results.line = await pushLineText(
        "🔔 ทดสอบแจ้งเตือน Dozo Genshin\nระบบ LINE ทำงานปกติ"
      );
    } else {
      results.line = {
        skipped: true,
        reason: !line.hasToken ? "missing_token" : "missing_recipients",
      };
    }

    if (discord.hasWebhook) {
      results.discord = await notifyNewOrderDiscord(sample);
    } else {
      results.discord = { skipped: true, reason: "missing_webhook" };
    }

    return json({ ok: true, results });
  }

  return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
}

export const GET = handler;
export const POST = handler;
