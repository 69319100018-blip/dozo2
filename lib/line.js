/**
 * LINE Messaging API helpers
 * (LINE Notify ปิดบริการแล้วตั้งแต่ มี.ค. 2025 — ใช้ Official Account แทน)
 *
 * Env ใน Vercel:
 * - LINE_CHANNEL_ACCESS_TOKEN  Channel access token (long-lived)
 * - LINE_NOTIFY_TO             userId หรือ groupId (หลายค่าคั่นด้วย comma)
 * - LINE_CHANNEL_SECRET        ใช้ตรวจลายเซ็น webhook (แนะนำ)
 */

const SERVICE_LABEL = {
  "farm-gem": "ฟาร์มเจม",
  material: "หาวัสดุ",
  "build-char": "ปั้นตัวละคร",
  abyss: "เคลียร์ Abyss",
  explore: "สำรวจแผนที่",
  oculus: "เก็บ Oculus",
};

function getConfig() {
  const token = String(process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
  const rawTo = String(process.env.LINE_NOTIFY_TO || "").trim();
  const recipients = rawTo
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { token, recipients };
}

export function isLineNotifyConfigured() {
  const { token, recipients } = getConfig();
  return Boolean(token && recipients.length);
}

export function getLineConfigStatus() {
  const { token, recipients } = getConfig();
  return {
    hasToken: Boolean(token),
    recipientCount: recipients.length,
    ready: Boolean(token && recipients.length),
  };
}

function formatBaht(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toLocaleString("th-TH")} ฿`;
}

function customerLabel({ customerName, customerEmail }) {
  const name = String(customerName || "").trim();
  if (name) return name;
  return customerEmail || "-";
}

export function buildNewOrderMessage({
  orderNumber,
  service,
  summary,
  gameUsername,
  gameUid,
  customerName,
  customerEmail,
  totalPrice,
  attachmentViewUrl,
  attachmentLabel,
}) {
  const serviceName = SERVICE_LABEL[service] || service || "-";
  const lines = [
    "🔔 ออเดอร์ใหม่ — Dozo Genshin",
    "",
    `เลขที่: #${orderNumber ?? "-"}`,
    `บริการ: ${serviceName}`,
    `รายละเอียด: ${summary || "-"}`,
    `ลูกค้า: ${customerLabel({ customerName, customerEmail })}`,
    `Username: ${gameUsername || "-"}`,
    `UID: ${gameUid || "-"}`,
    `ยอด: ${formatBaht(totalPrice)}`,
  ];

  if (attachmentViewUrl) {
    const label = attachmentLabel || "ดูภาพแนบ";
    lines.push("", `${label}:`, attachmentViewUrl);
  }

  lines.push("", "เข้าแผงแอดมินเพื่อตรวจสอบและมอบหมายงาน");
  return lines.join("\n");
}

/**
 * ส่งข้อความ push ไปยังผู้รับทุกคนใน LINE_NOTIFY_TO
 * ไม่ throw — ล้มเหลวแล้วแค่ log เพื่อไม่บล็อกการสร้างออเดอร์
 */
export async function pushLineText(text) {
  const { token, recipients } = getConfig();
  if (!token) {
    console.warn("[LINE] skip push: LINE_CHANNEL_ACCESS_TOKEN ยังไม่ได้ตั้ง");
    return { skipped: true, reason: "missing_token" };
  }
  if (!recipients.length) {
    console.warn("[LINE] skip push: LINE_NOTIFY_TO ยังไม่ได้ตั้ง (ต้องใส่ userId/groupId)");
    return { skipped: true, reason: "missing_recipients" };
  }

  const messageText = String(text || "").slice(0, 4900);
  const results = [];

  for (const to of recipients) {
    try {
      const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          messages: [{ type: "text", text: messageText }],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[LINE] push failed to=${to} status=${res.status} body=${body}`);
        results.push({ to, ok: false, status: res.status });
      } else {
        console.log(`[LINE] push ok to=${to}`);
        results.push({ to, ok: true });
      }
    } catch (error) {
      console.error(`[LINE] push error to=${to}`, error);
      results.push({ to, ok: false, error: String(error?.message || error) });
    }
  }

  return { skipped: false, results };
}

export async function notifyNewOrder(order) {
  const status = getLineConfigStatus();
  if (!status.ready) {
    console.warn(
      `[LINE] notifyNewOrder skipped hasToken=${status.hasToken} recipients=${status.recipientCount}`
    );
    return { skipped: true, reason: "not_configured", status };
  }

  const text = buildNewOrderMessage(order);
  const result = await pushLineText(text);
  console.log(
    `[LINE] notifyNewOrder order=#${order?.orderNumber ?? "-"} result=${JSON.stringify(result)}`
  );
  return result;
}
