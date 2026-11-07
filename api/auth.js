import {
  assertSameOrigin,
  buildSessionCookie,
  clearSessionCookie,
  errorMessage,
  getSessionUser,
  getSql,
  hashPassword,
  json,
  verifyPassword,
} from "../lib/server.js";

async function handler(request) {
  try {
    const sql = getSql();

    if (request.method === "GET") {
      const user = await getSessionUser(request);
      return json({ user });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
    }

    assertSameOrigin(request);
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "logout") {
      return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie() });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ error: "กรุณากรอกอีเมลให้ถูกต้อง" }, 400);
    }
    if (password.length < 8 || password.length > 200) {
      return json({ error: "รหัสผ่านต้องมีความยาว 8–200 ตัวอักษร" }, 400);
    }

    if (action === "register") {
      const displayName = String(body.displayName || "").trim().slice(0, 60);
      if (displayName.length < 2) {
        return json({ error: "กรุณากรอกชื่อที่ใช้แสดงอย่างน้อย 2 ตัวอักษร" }, 400);
      }

      const passwordHash = await hashPassword(password);
      try {
        const [user] = await sql`
          INSERT INTO users (email, display_name, password_hash)
          VALUES (${email}, ${displayName}, ${passwordHash})
          RETURNING id::text AS id, email, display_name AS "displayName", role
        `;
        return json({ success: true, user }, 201, {
          "Set-Cookie": buildSessionCookie(user.id),
        });
      } catch (error) {
        if (error?.code === "23505") {
          return json({ error: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ" }, 409);
        }
        throw error;
      }
    }

    if (action === "login") {
      const [record] = await sql`
        SELECT id::text AS id, email, display_name AS "displayName", role, password_hash
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;
      if (!record || !(await verifyPassword(password, record.password_hash))) {
        return json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, 401);
      }

      const user = {
        id: record.id,
        email: record.email,
        displayName: record.displayName,
        role: record.role,
      };
      return json({ success: true, user }, 200, {
        "Set-Cookie": buildSessionCookie(user.id),
      });
    }

    return json({ error: "ไม่รู้จักคำสั่งนี้" }, 400);
  } catch (error) {
    const status = error.status || 500;
    return json({ error: status === 500 ? errorMessage(error, "ระบบสมาชิกขัดข้อง กรุณาลองใหม่") : error.message }, status);
  }
}

export const GET = handler;
export const POST = handler;
