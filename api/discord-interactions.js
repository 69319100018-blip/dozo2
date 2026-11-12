/**
 * Discord Interactions endpoint — Slash commands สำหรับลูกทีม
 *
 * ตั้งใน Discord Developer Portal → General → Interactions Endpoint URL:
 *   https://dozo2.vercel.app/api/discord-interactions
 *
 * Env ที่ต้องมี:
 *   DISCORD_PUBLIC_KEY   — Public Key จาก General Information
 *   DISCORD_BOT_TOKEN    — Bot token (ใช้ตอนลงทะเบียนคำสั่ง / ตอบเพิ่มได้)
 *   DISCORD_APPLICATION_ID
 *   DATABASE_URL
 *
 * คำสั่ง: /รับงาน order:<เลขที่>
 */

import { createPublicKey, verify } from "node:crypto";
import { getSql, json } from "../lib/server.js";

const SERVICE_LABEL = {
  "farm-gem": "ฟาร์มเจม",
  material: "หาวัสดุ",
  "build-char": "ปั้นตัวละคร",
  abyss: "เคลียร์ Abyss",
  explore: "สำรวจแผนที่",
  oculus: "เก็บ Oculus",
};

function interactionResponse(type, data = {}) {
  return json({ type, data });
}

function textResponse(content, ephemeral = true) {
  return interactionResponse(4, {
    content: String(content).slice(0, 2000),
    flags: ephemeral ? 64 : 0,
  });
}

function verifyDiscordSignature(rawBody, signatureHex, timestamp, publicKeyHex) {
  if (!signatureHex || !timestamp || !publicKeyHex) return false;
  try {
    const key = createPublicKey({
      format: "jwk",
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: Buffer.from(publicKeyHex, "hex").toString("base64url"),
      },
    });
    return verify(
      null,
      Buffer.from(`${timestamp}${rawBody}`),
      key,
      Buffer.from(signatureHex, "hex")
    );
  } catch (error) {
    console.error("[discord] signature verify error", error);
    return false;
  }
}

function getOptionValue(interaction, name) {
  const options = interaction?.data?.options;
  if (!Array.isArray(options)) return null;
  const found = options.find((o) => o?.name === name);
  return found?.value ?? null;
}

function getDiscordUserId(interaction) {
  return (
    interaction?.member?.user?.id ||
    interaction?.user?.id ||
    null
  );
}

async function claimOrderByNumber(orderNumber, discordUserId) {
  const sql = getSql();
  const num = Number(orderNumber);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    return { ok: false, message: "เลขออเดอร์ไม่ถูกต้อง — ใส่ตัวเลขเช่น 4" };
  }

  const [staff] = await sql`
    SELECT id::text AS id, display_name AS "displayName", role, email
    FROM users
    WHERE discord_user_id = ${String(discordUserId)}
      AND role IN ('staff', 'admin')
    LIMIT 1
  `;

  if (!staff) {
    return {
      ok: false,
      message:
        "บัญชี Discord นี้ยังไม่ได้ผูกกับลูกทีมในระบบ\nให้แอดมินรัน SQL ตั้ง discord_user_id ให้ตรงกับ ID ของคุณ",
    };
  }

  const [existing] = await sql`
    SELECT
      order_number AS "orderNumber",
      service,
      summary,
      status,
      assigned_staff_id::text AS "assignedStaffId",
      s.display_name AS "assignedStaffName"
    FROM orders o
    LEFT JOIN users s ON s.id = o.assigned_staff_id
    WHERE o.order_number = ${num}
    LIMIT 1
  `;

  if (!existing) {
    return { ok: false, message: `ไม่พบออเดอร์ #${num}` };
  }

  if (existing.status === "done" || existing.status === "cancel") {
    return {
      ok: false,
      message: `ออเดอร์ #${num} สถานะ「${existing.status}」— รับงานไม่ได้`,
    };
  }

  if (existing.assignedStaffId) {
    if (existing.assignedStaffId === staff.id) {
      return {
        ok: true,
        message: `คุณรับออเดอร์ #${num} ไว้แล้ว\n${SERVICE_LABEL[existing.service] || existing.service} · ${existing.summary || "-"}`,
      };
    }
    return {
      ok: false,
      message: `ออเดอร์ #${num} ถูกมอบหมายให้ ${existing.assignedStaffName || "คนอื่น"} แล้ว`,
    };
  }

  const [updated] = await sql`
    UPDATE orders
    SET assigned_staff_id = ${staff.id}::uuid,
        updated_at = NOW()
    WHERE order_number = ${num}
      AND assigned_staff_id IS NULL
      AND status IN ('pending', 'doing')
    RETURNING
      order_number AS "orderNumber",
      service,
      summary,
      status
  `;

  if (!updated) {
    return {
      ok: false,
      message: `รับออเดอร์ #${num} ไม่สำเร็จ — อาจมีคนรับไปก่อนหน้านี้ ลองรีเฟรชคิว`,
    };
  }

  const serviceName = SERVICE_LABEL[updated.service] || updated.service;
  return {
    ok: true,
    message: [
      `รับงาน #${updated.orderNumber} สำเร็จ`,
      `ผู้รับ: ${staff.displayName || staff.email}`,
      `บริการ: ${serviceName}`,
      `รายละเอียด: ${updated.summary || "-"}`,
      "",
      "เปิดเว็บ → งานของฉัน เพื่อดูรายละเอียดทั้งหมด",
    ].join("\n"),
  };
}

async function handler(request) {
  if (request.method === "GET") {
    return json({
      ok: true,
      service: "dozo-discord-interactions",
      hasPublicKey: Boolean(process.env.DISCORD_PUBLIC_KEY),
      hasBotToken: Boolean(process.env.DISCORD_BOT_TOKEN),
      hasAppId: Boolean(process.env.DISCORD_APPLICATION_ID),
      hint: "ตั้ง Interactions Endpoint URL ชี้มาที่ path นี้ แล้วใช้ /รับงาน ใน Discord",
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature-ed25519") || "";
  const timestamp = request.headers.get("x-signature-timestamp") || "";
  const publicKey = String(process.env.DISCORD_PUBLIC_KEY || "").trim();

  if (!verifyDiscordSignature(rawBody, signature, timestamp, publicKey)) {
    console.error("[discord] invalid request signature");
    return json({ error: "invalid request signature" }, 401);
  }

  let interaction;
  try {
    interaction = JSON.parse(rawBody || "{}");
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // Discord PING
  if (interaction.type === 1) {
    return interactionResponse(1);
  }

  // APPLICATION_COMMAND
  if (interaction.type === 2) {
    const commandName = interaction?.data?.name || "";
    const discordUserId = getDiscordUserId(interaction);

    if (commandName === "รับงาน" || commandName === "claim") {
      if (!discordUserId) {
        return textResponse("ไม่พบ Discord user id");
      }
      const orderValue = getOptionValue(interaction, "order") ?? getOptionValue(interaction, "เลขที่");
      try {
        const result = await claimOrderByNumber(orderValue, discordUserId);
        return textResponse(result.message, true);
      } catch (error) {
        console.error("[discord] claim failed", error);
        return textResponse("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ — ลองใหม่หรือแจ้งแอดมิน", true);
      }
    }

    return textResponse(`ไม่รู้จักคำสั่ง: ${commandName}`, true);
  }

  return json({ error: "unknown interaction type" }, 400);
}

export const GET = handler;
export const POST = handler;
