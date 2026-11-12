/**
 * Discord webhook notifications สำหรับออเดอร์ใหม่
 * แนบภาพจาก Private Blob เข้า embed โดยตรง (ไม่ต้องเปิดลิงก์)
 *
 * Env ใน Vercel:
 * - DISCORD_WEBHOOK_URL  URL จาก Discord channel → Integrations → Webhooks
 *   รองรับหลาย URL คั่นด้วย comma
 */

import { get } from "@vercel/blob";

const SERVICE_LABEL = {
  "farm-gem": "ฟาร์มเจม",
  material: "หาวัสดุ",
  "build-char": "ปั้นตัวละคร",
  abyss: "เคลียร์ Abyss",
  explore: "สำรวจแผนที่",
  oculus: "เก็บ Oculus",
};

function getWebhookUrls() {
  const raw = String(process.env.DISCORD_WEBHOOK_URL || "").trim();
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.startsWith("https://discord.com/api/webhooks/") ||
        s.startsWith("https://discordapp.com/api/webhooks/")
    );
}

export function isDiscordNotifyConfigured() {
  return getWebhookUrls().length > 0;
}

function formatBaht(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toLocaleString("th-TH")} ฿`;
}

function customerLabel(order) {
  const name = String(order.customerName || "").trim();
  if (name) return name;
  return order.customerEmail || "-";
}

function attachmentFileName(pathname, contentType) {
  const base = String(pathname || "attachment").split("/").pop() || "attachment";
  if (/\.(jpe?g|png|webp)$/i.test(base)) return base.slice(0, 80);
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";
  return `${base.replace(/[^\w.-]+/g, "_").slice(0, 60)}.${ext}`;
}

function buildEmbed(order, { hasInlineImage = false, fileName = null } = {}) {
  const serviceName = SERVICE_LABEL[order.service] || order.service || "-";
  const fields = [
    { name: "บริการ", value: serviceName, inline: true },
    { name: "ยอด", value: formatBaht(order.totalPrice), inline: true },
    { name: "ลูกค้า", value: customerLabel(order), inline: false },
    { name: "Username", value: order.gameUsername || "-", inline: true },
    { name: "UID", value: String(order.gameUid || "-"), inline: true },
  ];

  // ถ้าแนบภาพในข้อความแล้ว ไม่ต้องใส่ลิงก์ (ยังเก็บลิงก์สำรองไว้ถ้าไม่มีไฟล์)
  if (!hasInlineImage && order.attachmentViewUrl) {
    const label = order.attachmentLabel || "ดูภาพแนบ";
    fields.push({
      name: "ภาพที่ลูกค้าส่ง",
      value: `[${label}](${order.attachmentViewUrl})`,
      inline: false,
    });
  } else if (hasInlineImage) {
    fields.push({
      name: "ภาพที่ลูกค้าส่ง",
      value: order.attachmentLabel || "แนบด้านล่าง",
      inline: false,
    });
  }

  const embed = {
    title: `🔔 ออเดอร์ใหม่ #${order.orderNumber ?? "-"}`,
    description: order.summary || "-",
    color: 0x4ecdc4,
    fields,
    footer: { text: "Dozo Genshin • เข้าแผงแอดมินเพื่อมอบหมายงาน" },
    timestamp: new Date().toISOString(),
  };

  if (hasInlineImage && fileName) {
    embed.image = { url: `attachment://${fileName}` };
  }

  return embed;
}

/**
 * ดึงภาพจาก Vercel Blob (private) เพื่อแนบไป Discord
 * คืน null ถ้าไม่มี path หรือดึงไม่ได้
 */
async function loadAttachmentFile(order) {
  const pathname = order.attachmentPath || null;
  if (!pathname) return null;

  try {
    const blob = await get(pathname, { access: "private" });
    if (!blob) return null;

    let contentType = blob.contentType || "image/jpeg";
    let bytes;

    if (typeof blob.arrayBuffer === "function") {
      bytes = new Uint8Array(await blob.arrayBuffer());
    } else if (blob.url) {
      const res = await fetch(blob.url);
      if (!res.ok) return null;
      contentType = res.headers.get("content-type") || contentType;
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      return null;
    }

    if (!bytes?.length) return null;
    // Discord webhook จำกัด ~25MB — ระบบเราจำกัด 3MB อยู่แล้ว
    if (bytes.length > 8 * 1024 * 1024) {
      console.warn("[Discord] attachment too large, skip inline image");
      return null;
    }

    const fileName = attachmentFileName(pathname, contentType);
    return { bytes, contentType, fileName };
  } catch (error) {
    console.error("[Discord] load attachment failed", error);
    return null;
  }
}

async function postJsonWebhook(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[Discord] webhook failed status=${res.status} body=${text}`);
    return { ok: false, status: res.status };
  }
  return { ok: true };
}

async function postMultipartWebhook(url, payload, file) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify(payload));
  form.append(
    "files[0]",
    new Blob([file.bytes], { type: file.contentType }),
    file.fileName
  );

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[Discord] webhook multipart failed status=${res.status} body=${text}`);
    return { ok: false, status: res.status };
  }
  return { ok: true };
}

/**
 * ส่งแจ้งเตือนออเดอร์ไป Discord
 * ถ้ามีภาพแนบ จะดึงจาก Blob แล้วส่งเป็นไฟล์ในข้อความ (เห็นใน Discord เลย)
 * ไม่ throw — ล้มเหลวแล้วแค่ log
 */
export async function notifyNewOrderDiscord(order) {
  const urls = getWebhookUrls();
  if (!urls.length) {
    console.warn("[Discord] skip: DISCORD_WEBHOOK_URL ยังไม่ได้ตั้ง");
    return { skipped: true, reason: "not_configured" };
  }

  const file = await loadAttachmentFile(order);
  const embed = buildEmbed(order, {
    hasInlineImage: Boolean(file),
    fileName: file?.fileName || null,
  });

  const payload = {
    username: "Dozo Genshin",
    content: `ออเดอร์ใหม่ #${order.orderNumber ?? "-"} — ${SERVICE_LABEL[order.service] || order.service || "บริการ"} · ${customerLabel(order)}`,
    embeds: [embed],
  };

  const results = [];
  for (const url of urls) {
    try {
      let result;
      if (file) {
        result = await postMultipartWebhook(url, payload, file);
        // ถ้าส่งแนบรูปไม่สำเร็จ ลองส่งแบบลิงก์สำรอง
        if (!result.ok) {
          const fallbackEmbed = buildEmbed(order, { hasInlineImage: false });
          result = await postJsonWebhook(url, {
            ...payload,
            embeds: [fallbackEmbed],
          });
        }
      } else {
        result = await postJsonWebhook(url, payload);
      }
      if (result.ok) console.log("[Discord] webhook ok", file ? "(with image)" : "(no image)");
      results.push(result);
    } catch (error) {
      console.error("[Discord] webhook error", error);
      results.push({ ok: false, error: String(error?.message || error) });
    }
  }

  return { skipped: false, results, attachedImage: Boolean(file) };
}
