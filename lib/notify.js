/**
 * รวมช่องทางแจ้งเตือนออเดอร์ใหม่ (LINE + Discord)
 * เรียกคู่ขนาน ไม่ให้ช่องใดช่องหนึ่งบล็อกอีกช่อง
 */

import { notifyNewOrder as notifyLine } from "./line.js";
import { notifyNewOrderDiscord as notifyDiscord } from "./discord.js";

export async function notifyNewOrderAll(order) {
  const payload = {
    orderNumber: order.orderNumber,
    service: order.service,
    summary: order.summary,
    gameUsername: order.gameUsername,
    gameUid: order.gameUid ?? order.uid,
    customerName: order.customerName || order.displayName || "",
    customerEmail: order.customerEmail || "",
    totalPrice: order.totalPrice,
    attachmentViewUrl: order.attachmentViewUrl || null,
    attachmentLabel: order.attachmentLabel || "ดูภาพแนบ",
  };

  const [line, discord] = await Promise.all([
    notifyLine(payload).catch((error) => {
      console.error("[notify] LINE failed", error);
      return { ok: false, error: String(error?.message || error) };
    }),
    notifyDiscord(payload).catch((error) => {
      console.error("[notify] Discord failed", error);
      return { ok: false, error: String(error?.message || error) };
    }),
  ]);

  return { line, discord };
}
