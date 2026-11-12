/**
 * ลงทะเบียน Slash command /รับงาน กับ Discord (รันครั้งเดียวหลัง deploy)
 *
 * วิธีใช้ (ล็อกอินแอดมินบนเว็บ แล้วเรียก):
 *   POST https://dozo2.vercel.app/api/discord-register-commands
 *   Header: Cookie session ของแอดมิน
 *
 * หรือใส่ query ?secret=ค่า_ใน_DISCORD_REGISTER_SECRET
 *
 * Env:
 *   DISCORD_BOT_TOKEN
 *   DISCORD_APPLICATION_ID
 *   DISCORD_REGISTER_SECRET (ทางเลือก — ถ้าระบุ จะใช้แทนการล็อกอินแอดมินได้)
 *   DISCORD_GUILD_ID (ทางเลือก — ถ้าใส่จะลงทะเบียนเฉพาะเซิร์ฟ ขึ้นทันที)
 */

import { getSessionUser, json } from "../lib/server.js";

const COMMANDS = [
  {
    name: "รับงาน",
    description: "รับออเดอร์จากคิว Dozo ตามเลขที่",
    type: 1,
    options: [
      {
        name: "order",
        description: "เลขออเดอร์ เช่น 4",
        type: 4,
        required: true,
        min_value: 1,
      },
    ],
  },
];

async function handler(request) {
  if (request.method === "GET") {
    return json({
      ok: true,
      service: "dozo-discord-register-commands",
      commands: COMMANDS.map((c) => c.name),
      hint: "POST เพื่อลงทะเบียนคำสั่ง (ต้องเป็นแอดมิน หรือใส่ secret)",
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
  }

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || request.headers.get("x-register-secret") || "";
  const envSecret = String(process.env.DISCORD_REGISTER_SECRET || "").trim();
  let authorized = Boolean(envSecret && secret && secret === envSecret);

  if (!authorized) {
    const user = await getSessionUser(request);
    if (user?.role === "admin") authorized = true;
  }

  if (!authorized) {
    return json({ error: "ต้องเป็นแอดมิน หรือใส่ DISCORD_REGISTER_SECRET ให้ถูกต้อง" }, 403);
  }

  const token = String(process.env.DISCORD_BOT_TOKEN || "").trim();
  const appId = String(process.env.DISCORD_APPLICATION_ID || "").trim();
  const guildId = String(process.env.DISCORD_GUILD_ID || "").trim();

  if (!token || !appId) {
    return json(
      { error: "ขาด DISCORD_BOT_TOKEN หรือ DISCORD_APPLICATION_ID ใน Environment Variables" },
      500
    );
  }

  const endpoint = guildId
    ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${appId}/commands`;

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(COMMANDS),
  });

  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = bodyText;
  }

  if (!res.ok) {
    console.error("[discord] register commands failed", res.status, bodyText);
    return json({ error: "ลงทะเบียนคำสั่งไม่สำเร็จ", status: res.status, body }, 502);
  }

  return json({
    ok: true,
    scope: guildId ? `guild:${guildId}` : "global",
    commands: Array.isArray(body) ? body.map((c) => ({ id: c.id, name: c.name })) : body,
    note: guildId
      ? "ลงทะเบียนเฉพาะเซิร์ฟ — ใช้ได้ทันที"
      : "ลงทะเบียนแบบ global — อาจใช้เวลาสูงสุดประมาณ 1 ชั่วโมงถึงจะขึ้นครบ",
  });
}

export const GET = handler;
export const POST = handler;
