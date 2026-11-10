import {
  assertSameOrigin,
  errorMessage,
  getSessionUser,
  getSql,
  isPrivateUploadPathForUser,
  json,
} from "../lib/server.js";
import { notifyNewOrderAll } from "../lib/notify.js";

const FARM_PRICES = new Map([
  [160, 10], [320, 18], [480, 29], [680, 36], [800, 49],
  [1600, 90], [3200, 160], [4800, 249], [6400, 370], [8000, 440],
  [9600, 500], [11200, 580], [12800, 680], [14400, 770], [16000, 890],
]);
const ALLOWED_SERVICES = new Set(["farm-gem", "material", "build-char", "abyss", "explore"]);
const ALLOWED_STATUSES = new Set(["pending", "doing", "done", "cancel"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const materialType = cleanText(d.materialType || d.package, 80);
    if (!materialType) throw new Error("กรุณาเลือกประเภทวัสดุ");
    const note = cleanText(d.note, 1500);
    if (!note) throw new Error("กรุณาระบุรายละเอียดวัสดุที่ต้องการ");
    const forCharacter = cleanText(d.forCharacter || d.character, 100);
    return {
      details: { ...details, materialType, note, forCharacter: forCharacter || null },
      totalPrice: null,
      summary: forCharacter
        ? `หาวัสดุ · ${materialType} · ${forCharacter}`
        : `หาวัสดุ · ${materialType}`,
    };
  }

  if (service === "build-char") {
    const character = cleanText(d.character, 100);
    if (!character) throw new Error("กรุณาเลือกตัวละคร");
    const goal = cleanText(d.goal || d.package, 80);
    if (!goal) throw new Error("กรุณาเลือกเป้าหมายการปั้น");
    const levelFrom = cleanText(d.levelFrom, 20);
    const levelTo = cleanText(d.levelTo, 20);
    const talent = cleanText(d.talent, 120);
    const note = cleanText(d.note, 1500);
    const levelPart = [levelFrom, levelTo].filter(Boolean).join("→");
    const summaryParts = [`ปั้น ${character}`, goal];
    if (levelPart) summaryParts.push(`Lv ${levelPart}`);
    if (talent) summaryParts.push(`Talent ${talent}`);
    return {
      details: {
        ...details,
        character,
        goal,
        levelFrom: levelFrom || null,
        levelTo: levelTo || null,
        talent: talent || null,
        note: note || null,
      },
      totalPrice: null,
      summary: summaryParts.join(" · "),
    };
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
      let orders;
      if (user.role === "admin") {
        orders = await sql`
          SELECT
            o.id::text AS id,
            o.order_number AS "orderNumber",
            o.service,
            o.summary,
            u.email AS "customerEmail",
            o.game_username AS "gameUsername",
            o.game_uid AS uid,
            o.status,
            o.total_price AS "totalPrice",
            o.details,
            o.slip_path AS "slipPath",
            o.attachment_path AS "attachmentPath",
            o.assigned_staff_id::text AS "assignedStaffId",
            s.display_name AS "assignedStaffName",
            s.email AS "assignedStaffEmail",
            o.created_at AS "createdAt",
            o.updated_at AS "updatedAt"
          FROM orders o
          JOIN users u ON u.id = o.customer_id
          LEFT JOIN users s ON s.id = o.assigned_staff_id
          ORDER BY o.created_at DESC
          LIMIT 500
        `;
      } else if (user.role === "staff") {
        // ลูกทีมเห็นเฉพาะงานที่แอดมินส่งมอบให้แล้ว
        orders = await sql`
          SELECT
            o.id::text AS id,
            o.order_number AS "orderNumber",
            o.service,
            o.summary,
            u.email AS "customerEmail",
            o.game_username AS "gameUsername",
            o.game_uid AS uid,
            o.status,
            o.total_price AS "totalPrice",
            o.details,
            o.slip_path AS "slipPath",
            o.attachment_path AS "attachmentPath",
            o.assigned_staff_id::text AS "assignedStaffId",
            s.display_name AS "assignedStaffName",
            s.email AS "assignedStaffEmail",
            o.created_at AS "createdAt",
            o.updated_at AS "updatedAt"
          FROM orders o
          JOIN users u ON u.id = o.customer_id
          LEFT JOIN users s ON s.id = o.assigned_staff_id
          WHERE o.assigned_staff_id = ${user.id}
          ORDER BY o.created_at DESC
          LIMIT 200
        `;
      } else {
        orders = await sql`
          SELECT
            o.id::text AS id,
            o.order_number AS "orderNumber",
            o.service,
            o.summary,
            u.email AS "customerEmail",
            o.game_username AS "gameUsername",
            o.game_uid AS uid,
            o.status,
            o.total_price AS "totalPrice",
            o.details,
            o.slip_path AS "slipPath",
            o.attachment_path AS "attachmentPath",
            o.assigned_staff_id::text AS "assignedStaffId",
            s.display_name AS "assignedStaffName",
            s.email AS "assignedStaffEmail",
            o.created_at AS "createdAt",
            o.updated_at AS "updatedAt"
          FROM orders o
          JOIN users u ON u.id = o.customer_id
          LEFT JOIN users s ON s.id = o.assigned_staff_id
          WHERE o.customer_id = ${user.id}
          ORDER BY o.created_at DESC
          LIMIT 100
        `;
      }
      return json({ orders });
    }

    if (request.method === "POST") {
      assertSameOrigin(request);
      if (user.role === "staff") {
        return json({ error: "บัญชีลูกทีมไม่สามารถสั่งซื้อผ่านระบบนี้ได้" }, 403);
      }

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
      if (service === "build-char" && attachmentPath && !validateUploadPath(attachmentPath, user.id)) {
        return json({ error: "ไฟล์แนบไม่ถูกต้อง" }, 400);
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

      // แจ้งเตือน LINE + Discord (ไม่บล็อกการสร้างออเดอร์ถ้าส่งไม่สำเร็จ)
      try {
        await notifyNewOrderAll({
          orderNumber: order.orderNumber,
          service: order.service,
          summary: order.summary,
          gameUsername: order.gameUsername,
          gameUid: order.uid,
          customerEmail: user.email,
          totalPrice: order.totalPrice,
        });
      } catch (notifyError) {
        console.error("[notify] notifyNewOrderAll failed", notifyError);
      }

      return json({ success: true, order }, 201);
    }

    if (request.method === "PATCH") {
      assertSameOrigin(request);
      const id = new URL(request.url).searchParams.get("id");
      const body = await request.json();
      if (!id || !UUID_RE.test(id)) return json({ error: "รหัสออเดอร์ไม่ถูกต้อง" }, 400);

      // Admin: เปลี่ยนสถานะ และ/หรือ มอบหมายงาน
      if (user.role === "admin") {
        const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
        const hasAssign = Object.prototype.hasOwnProperty.call(body, "assignedStaffId");

        if (!hasStatus && !hasAssign) {
          return json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, 400);
        }

        if (hasStatus) {
          const status = cleanText(body.status, 20);
          if (!ALLOWED_STATUSES.has(status)) return json({ error: "สถานะไม่ถูกต้อง" }, 400);
          const [updatedStatus] = await sql`
            UPDATE orders SET status = ${status}, updated_at = NOW()
            WHERE id = ${id}::uuid
            RETURNING id::text AS id, status, assigned_staff_id::text AS "assignedStaffId"
          `;
          if (!updatedStatus) return json({ error: "ไม่พบออเดอร์นี้" }, 404);
          if (!hasAssign) return json({ success: true, order: updatedStatus });
        }

        if (hasAssign) {
          const rawStaff = body.assignedStaffId;
          if (rawStaff === null || rawStaff === "") {
            const [updated] = await sql`
              UPDATE orders
              SET assigned_staff_id = NULL, updated_at = NOW()
              WHERE id = ${id}::uuid
              RETURNING id::text AS id, status, assigned_staff_id::text AS "assignedStaffId"
            `;
            if (!updated) return json({ error: "ไม่พบออเดอร์นี้" }, 404);
            return json({ success: true, order: updated });
          }

          const staffId = cleanText(rawStaff, 64);
          if (!UUID_RE.test(staffId)) return json({ error: "รหัสลูกทีมไม่ถูกต้อง" }, 400);

          const [staff] = await sql`
            SELECT id::text AS id FROM users
            WHERE id = ${staffId}::uuid AND role = 'staff'
            LIMIT 1
          `;
          if (!staff) return json({ error: "ไม่พบลูกทีมนี้ หรือบัญชีไม่ได้เป็น staff" }, 404);

          const [updated] = await sql`
            UPDATE orders
            SET assigned_staff_id = ${staffId}::uuid, updated_at = NOW()
            WHERE id = ${id}::uuid
            RETURNING id::text AS id, status, assigned_staff_id::text AS "assignedStaffId"
          `;
          if (!updated) return json({ error: "ไม่พบออเดอร์นี้" }, 404);
          return json({ success: true, order: updated });
        }
      }

      // Staff: เปลี่ยนสถานะได้เฉพาะงานที่ถูกส่งมอบให้ตัวเองแล้ว
      if (user.role === "staff") {
        const status = cleanText(body.status, 20);
        if (!ALLOWED_STATUSES.has(status)) return json({ error: "สถานะไม่ถูกต้อง" }, 400);

        const [updated] = await sql`
          UPDATE orders
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${id}::uuid
            AND assigned_staff_id = ${user.id}
          RETURNING id::text AS id, status, assigned_staff_id::text AS "assignedStaffId"
        `;
        if (!updated) {
          return json({
            error: "ไม่มีสิทธิ์แก้สถานะนี้ — งานยังไม่ได้ถูกส่งมอบให้คุณ หรือไม่พบออเดอร์",
          }, 403);
        }
        return json({ success: true, order: updated });
      }

      return json({ error: "ไม่มีสิทธิ์จัดการออเดอร์" }, 403);
    }

    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST, PATCH" });
  } catch (error) {
    if (
      error.message === "แพ็กเกจเจมไม่ถูกต้อง" ||
      error.message === "กรุณาเลือกตัวละคร" ||
      error.message === "กรุณาเลือกประเภทวัสดุ" ||
      error.message === "กรุณาระบุรายละเอียดวัสดุที่ต้องการ" ||
      error.message === "กรุณาเลือกเป้าหมายการปั้น" ||
      error.message === "กรุณาเลือกแพ็กเกจหรือเป้าหมาย"
    ) {
      return json({ error: error.message }, 400);
    }
    return json({ error: errorMessage(error, "ไม่สามารถบันทึกข้อมูลออเดอร์ได้") }, error.status || 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
