import {
  assertSameOrigin,
  errorMessage,
  getSessionUser,
  getSql,
  json,
} from "../lib/server.js";

const FARM_DISCOUNT_KEY = "farm_gem_discount_percent";
const ALLOWED_DISCOUNTS = new Set([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);

async function ensureSettingsTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by UUID
    )
  `;
}

async function getFarmDiscountPercent(sql) {
  try {
    await ensureSettingsTable(sql);
    const [row] = await sql`
      SELECT value
      FROM app_settings
      WHERE key = ${FARM_DISCOUNT_KEY}
      LIMIT 1
    `;
    const n = Number(row?.value);
    if (!Number.isFinite(n) || !ALLOWED_DISCOUNTS.has(n)) return 0;
    return n;
  } catch (err) {
    console.error("getFarmDiscountPercent", err);
    return 0;
  }
}

async function setFarmDiscountPercent(sql, percent, userId) {
  await ensureSettingsTable(sql);
  const value = String(percent);
  await sql`
    INSERT INTO app_settings (key, value, updated_at, updated_by)
    VALUES (${FARM_DISCOUNT_KEY}, ${value}, NOW(), ${userId || null})
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by
  `;
}

async function handler(request) {
  if (request.method === "GET") {
    const promptPayId = String(process.env.PROMPTPAY_ID || "").trim();
    const promptPayName = String(process.env.PROMPTPAY_NAME || "Dozo Genshin").trim();
    let farmGemDiscountPercent = 0;
    try {
      const sql = getSql();
      farmGemDiscountPercent = await getFarmDiscountPercent(sql);
    } catch (err) {
      console.error("config GET discount", err);
    }

    return json({
      promptPayId: promptPayId || null,
      promptPayName,
      hasPromptPay: Boolean(promptPayId),
      farmGemDiscountPercent,
    });
  }

  if (request.method === "PATCH") {
    try {
      assertSameOrigin(request);
      const user = await getSessionUser(request);
      if (!user || user.role !== "admin") {
        return json({ error: "เฉพาะแอดมินเท่านั้นที่ปรับลดราคาได้" }, 403);
      }

      const body = await request.json().catch(() => ({}));
      const percent = Number(body?.farmGemDiscountPercent);
      if (!Number.isFinite(percent) || !ALLOWED_DISCOUNTS.has(percent)) {
        return json({
          error: "ค่าลดราคาไม่ถูกต้อง เลือกได้เฉพาะ 0, 5, 10, …, 50",
        }, 400);
      }

      const sql = getSql();
      await setFarmDiscountPercent(sql, percent, user.id);
      return json({
        success: true,
        farmGemDiscountPercent: percent,
        message:
          percent === 0
            ? "ปิดโปรโมชันลดราคาฟาร์มเจมแล้ว"
            : `เปิดลดราคาฟาร์มเจม ${percent}% แล้ว`,
      });
    } catch (error) {
      return json({ error: errorMessage(error) }, error.status || 500);
    }
  }

  return json({ error: "Method not allowed" }, 405, {
    Allow: "GET, PATCH",
  });
}

export const GET = handler;
export const PATCH = handler;
