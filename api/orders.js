import {
  assertSameOrigin,
  errorMessage,
  getSessionUser,
  getSql,
  isPrivateUploadPathForUser,
  json,
} from "../lib/server.js";

const FARM_PRICES = new Map([
  [160, 10], [320, 18], [480, 29], [680, 36], [800, 49],
  [1600, 90], [3200, 160], [4800, 249], [6400, 370], [8000, 440],
  [9600, 500], [11200, 580], [12800, 680], [14400, 770], [16000, 890],
]);
const ALLOWED_SERVICES = new Set(["farm-gem", "material", "abyss", "explore"]);
const ALLOWED_STATUSES = new Set(["pending", "doing", "done", "cancel"]);

function cleanText(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanStream(value) {
  return value === "yes" ? "yes" : "no";
}

function validateUploadPath(pathname, userId) {
  return isPrivateUploadPathForUser(pathname, userId);
}

function buildDetails(service, raw) {
  const d = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const details = {
    prohibitions: cleanText(d.prohibitions, 1500),
    stream: cleanStream(d.stream),
  };

  if (service === "farm-gem") {
    const gems = Number(d.gems);
    if (!FARM_PRICES.has(gems)) throw new Error("แพ็กเกจเจมไม่ถูกต้อง");
    const rush = d.rush === true;
    const basePrice = FARM_PRICES.get(gems);
    return {
      details: { ...details, gems, rush },
      totalPrice: rush ? Math.round(basePrice * 1.3) : basePrice,
      summary: `${gems.toLocaleString("en-US")} เจม${rush ? " (งานเร่ง)" : ""} · ${rush ? Math.round(basePrice * 1.3) : basePrice}฿`,
    };
  }

  if (service === "material") {
    const character = cleanText(d.character, 100);
    if (!character) throw new Error("กรุณาเลือกตัวละคร");
    const note = cleanText(d.note, 1500);
    return { details: { ...details, character, note }, totalPrice: null, summary: `ตัวละคร: ${character}` };
  }

  const packageName = cleanText(d.package, 100);
  if (!packageName) throw new Error("กรุณาเลือกแพ็กเกจหรือเป้าหมาย");
  const detail = cleanText(d.detail, 1500);
  return {
    details: { ...details, package: packageName, detail },
    totalPrice: null,
    summary: packageName + (detail ? ` · ${detail}` : ""),
  };
}

async function handler(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return json({ error: "กรุณาเข้าสู่ระบบก่อน" }, 401);

    const sql = getSql();

    if (request.method === "GET") {
      const orders = user.role === "admin"
        ? await sql`
            SELECT o.id::text AS id, o.order_number AS "orderNumber", o.service,
              o.summary, u.email AS "customerEmail", o.game_username AS "gameUsername",
              o.game_uid AS uid, o.status, o.total_price AS "totalPrice",
              o.details, o.slip_path AS "slipPath", o.attachment_path AS "attachmentPath",
              o.created_at AS "createdAt"
            FROM orders o JOIN users u ON u.id = o.customer_id
            ORDER BY o.created_at DESC LIMIT 500
          `
        : await sql`
            SELECT o.id::text AS id, o.order_number AS "orderNumber", o.service,
              o.summary, u.email AS "customerEmail", o.game_username AS "gameUsername",
              o.game_uid AS uid, o.status, o.total_price AS "totalPrice",
              o.details, o.slip_path AS "slipPath", o.attachment_path AS "attachmentPath",
              o.created_at AS "createdAt"
            FROM orders o JOIN users u ON u.id = o.customer_id
            WHERE o.customer_id = ${user.id}
            ORDER BY o.created_at DESC LIMIT 100
          `;
      return json({ orders });
    }

    if (request.method === "POST") {
      assertSameOrigin(request);
      const body = await request.json();
      const service = cleanText(body.service, 30);
      if (!ALLOWED_SERVICES.has(service)) return json({ error: "ไม่พบบริการนี้" }, 400);

      const gameUsername = cleanText(body.gameUsername, 100);
      const gameUid = cleanText(body.gameUid, 40);
      if (!gameUsername || !gameUid) return json({ error: "กรุณากรอก Username และ UID ให้ครบ" }, 400);

      const slipPath = cleanText(body.slipPath, 500);
      const attachmentPath = body.attachmentPath ? cleanText(body.attachmentPath, 500) : null;
      if (!validateUploadPath(slipPath, user.id)) return json({ error: "กรุณาอัปโหลดสลิปใหม่" }, 400);
      if (service === "material" && !validateUploadPath(attachmentPath, user.id)) {
        return json({ error: "กรุณาอัปโหลดภาพวัสดุใหม่" }, 400);
      }
      if (attachmentPath && !validateUploadPath(attachmentPath, user.id)) {
        return json({ error: "ไฟล์แนบไม่ถูกต้อง" }, 400);
      }

      const normalized = buildDetails(service, body.details);
      const [order] = await sql`
        INSERT INTO orders (
          customer_id, service, summary, game_username, game_uid,
          status, total_price, details, slip_path, attachment_path
        ) VALUES (
          ${user.id}, ${service}, ${normalized.summary}, ${gameUsername}, ${gameUid},
          'pending', ${normalized.totalPrice}, ${JSON.stringify(normalized.details)}::jsonb,
          ${slipPath}, ${attachmentPath}
        )
        RETURNING id::text AS id, order_number AS "orderNumber", service,
          summary, game_username AS "gameUsername", game_uid AS uid,
          status, total_price AS "totalPrice", created_at AS "createdAt"
      `;
      return json({ success: true, order }, 201);
    }

    if (request.method === "PATCH") {
      assertSameOrigin(request);
      if (user.role !== "admin") return json({ error: "ไม่มีสิทธิ์จัดการออเดอร์" }, 403);
      const id = new URL(request.url).searchParams.get("id");
      const body = await request.json();
      const status = cleanText(body.status, 20);
      if (!id || !ALLOWED_STATUSES.has(status)) return json({ error: "ข้อมูลอัปเดตไม่ถูกต้อง" }, 400);

      const [updated] = await sql`
        UPDATE orders SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING id::text AS id, status
      `;
      if (!updated) return json({ error: "ไม่พบออเดอร์นี้" }, 404);
      return json({ success: true, order: updated });
    }

    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST, PATCH" });
  } catch (error) {
    if (error.message === "แพ็กเกจเจมไม่ถูกต้อง" || error.message === "กรุณาเลือกตัวละคร" || error.message === "กรุณาเลือกแพ็กเกจหรือเป้าหมาย") {
      return json({ error: error.message }, 400);
    }
    return json({ error: errorMessage(error, "ไม่สามารถบันทึกข้อมูลออเดอร์ได้") }, error.status || 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
