import {
  assertSameOrigin,
  errorMessage,
  getSessionUser,
  getSql,
  json,
} from "../lib/server.js";

function cleanText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function handler(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return json({ error: "กรุณาเข้าสู่ระบบก่อน" }, 401);
    if (user.role !== "admin") return json({ error: "เฉพาะแอดมินเท่านั้นที่จัดการลูกทีมได้" }, 403);

    const sql = getSql();

    if (request.method === "GET") {
      const [staff, candidates] = await Promise.all([
        sql`
          SELECT id::text AS id, email, display_name AS "displayName",
            staff_title AS "staffTitle", staff_description AS "staffDescription",
            created_at AS "createdAt"
          FROM users
          WHERE role = 'staff'
          ORDER BY created_at ASC
          LIMIT 500
        `,
        sql`
          SELECT id::text AS id, email, display_name AS "displayName", role
          FROM users
          WHERE role IN ('customer', 'member')
          ORDER BY created_at DESC
          LIMIT 500
        `,
      ]);
      return json({ staff, candidates });
    }

    if (request.method === "PATCH") {
      assertSameOrigin(request);
      const body = await request.json();
      const userId = cleanText(body.userId, 64);
      const role = cleanText(body.role, 20);

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        return json({ error: "รหัสสมาชิกไม่ถูกต้อง" }, 400);
      }

      if (role === "staff") {
        const staffTitle = cleanText(body.staffTitle, 80) || "ทีมงาน";
        const staffDescription = cleanText(body.staffDescription, 180);
        const [updated] = await sql`
          UPDATE users
          SET role = 'staff', staff_title = ${staffTitle},
              staff_description = ${staffDescription || null}, updated_at = NOW()
          WHERE id = ${userId}::uuid AND role IN ('customer', 'member')
          RETURNING id::text AS id, email, display_name AS "displayName",
            role, staff_title AS "staffTitle", staff_description AS "staffDescription"
        `;
        if (!updated) {
          return json({ error: "ไม่พบบัญชีลูกค้า หรือบัญชีนี้ไม่ได้อยู่ในสถานะลูกค้า/สมาชิก" }, 404);
        }
        return json({ success: true, member: updated });
      }

      if (role === "customer") {
        const [updated] = await sql`
          UPDATE users
          SET role = 'customer', staff_title = NULL,
              staff_description = NULL, updated_at = NOW()
          WHERE id = ${userId}::uuid AND role = 'staff'
          RETURNING id::text AS id, email, display_name AS "displayName", role
        `;
        if (!updated) {
          return json({ error: "ไม่พบลูกทีมนี้ หรือบัญชีไม่ได้เป็นลูกทีมอยู่แล้ว" }, 404);
        }
        return json({ success: true, member: updated });
      }

      return json({ error: "อนุญาตให้เปลี่ยนได้เฉพาะ customer หรือ staff" }, 400);
    }

    return json({ error: "Method not allowed" }, 405, { Allow: "GET, PATCH" });
  } catch (error) {
    const status = error.status || 500;
    return json({ error: errorMessage(error, "จัดการข้อมูลลูกทีมไม่สำเร็จ") }, status);
  }
}

export const GET = handler;
export const PATCH = handler;
