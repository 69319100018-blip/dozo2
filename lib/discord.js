	/**
 * Discord webhook notifications สำหรับออเดอร์ใหม่
 *
 * Env ใน Vercel:
 * - DISCORD_WEBHOOK_URL  URL จาก Discord channel → Integrations → Webhooks
 *   รองรับหลาย URL คั่นด้วย comma
 */

const SERVICE_LABEL = {
  "farm-gem": "ฟาร์มเจม",
  material: "หาวัสดุ",
  "build-char": "ปั้นตัวละคร",
  abyss: "เคลียร์ Abyss",
  explore: "สำรวจแผนที่",
};

function getWebhookUrls() {
  const raw = String(process.env.DISCORD_WEBHOOK_URL || "").trim();
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("https://discord.com/api/webhooks/") || s.startsWith("https://discordapp.com/api/webhooks/"));
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

function buildEmbed(order) {
  const serviceName = SERVICE_LABEL[order.service] || order.service || "-";
  const fields = [
    { name: "บริการ", value: serviceName, inline: true },
    { name: "ยอด", value: formatBaht(order.totalPrice), inline: true },
    { name: "ลูกค้า", value: customerLabel(order), inline: false },
    { name: "Username", value: order.gameUsername || "-", inline: true },
    { name: "UID", value: String(order.gameUid || "-"), inline: true },
  ];

  if (order.attachmentViewUrl) {
    const label = order.attachmentLabel || "ดูภาพแนบ";
    fields.push({
      name: "ภาพที่ลูกค้าส่ง",
      value: `[${label}](${order.attachmentViewUrl})`,
      inline: false,
    });
  }

  return {
    title: `🔔 ออเดอร์ใหม่ #${order.orderNumber ?? "-"}`,
    description: order.summary || "-",
    color: 0x4ecdc4,
    fields,
    footer: { text: "Dozo Genshin • เข้าแผงแอดมินเพื่อมอบหมายงาน" },
    timestamp: new Date().toISOString(),
  };
}

/**
 * ส่งแจ้งเตือนออเดอร์ไป Discord
 * ไม่ throw — ล้มเหลวแล้วแค่ log
 */
export async function notifyNewOrderDiscord(order) {
  const urls = getWebhookUrls();
  if (!urls.length) {
    console.warn("[Discord] skip: DISCORD_WEBHOOK_URL ยังไม่ได้ตั้ง");
    return { skipped: true, reason: "not_configured" };
  }

  const body = {
    username: "Dozo Genshin",
    content: `ออเดอร์ใหม่ #${order.orderNumber ?? "-"} — ${SERVICE_LABEL[order.service] || order.service || "บริการ"} · ${customerLabel(order)}`,
    embeds: [buildEmbed(order)],
  };

  const results = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[Discord] webhook failed status=${res.status} body=${text}`);
        results.push({ ok: false, status: res.status });
      } else {
        console.log("[Discord] webhook ok");
        results.push({ ok: true });
      }
    } catch (error) {
      console.error("[Discord] webhook error", error);
      results.push({ ok: false, error: String(error?.message || error) });
    }
  }

  return { skipped: false, results };
}
