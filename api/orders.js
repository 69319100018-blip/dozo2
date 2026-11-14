import {
  assertSameOrigin,
  buildAttachmentViewUrl,
  errorMessage,
  getSessionUser,
  getSql,
  isValidOrderUploadPath,
  json,
} from "../lib/server.js";
import { notifyNewOrderAll } from "../lib/notify.js";

// ราคาฟาร์มเจม — ลูกค้าปกติ
const FARM_PRICES_CUSTOMER = new Map([
  [160, 10], [320, 18], [480, 29], [680, 36], [800, 49],
  [1600, 90], [3200, 180], [4800, 290], [6400, 380], [8000, 490],
  [9600, 570], [11200, 695], [12800, 785], [14400, 895], [16000, 1090],
]);

// ราคาฟาร์มเจม — สมาชิก (member) ถูกกว่า ~5%
const FARM_PRICES_MEMBER = new Map([
  [160, 10], [320, 18], [480, 29], [680, 36], [800, 49],
  [1600, 90], [3200, 180], [4800, 275], [6400, 361], [8000, 465],
  [9600, 541], [11200, 660], [12800, 745], [14400, 850], [16000, 1035],
]);

const ALLOWED_SERVICES = new Set(["farm-gem", "material", "build-char", "abyss", "explore", "oculus"]);
const ALLOWED_STATUSES = new Set(["pending", "doing", "done", "cancel"]);

// ราคาต่อชิ้น (หรือต่อเลเวลสำหรับอุตริมณฑล)
const OCULUS_UNIT_PRICES = new Map([
  ["anemoculus", 1],
  ["geoculus", 1.5],
  ["electroculus", 2.5],
  ["dendroculus", 2.5],
  ["hydroculus", 3],
  ["pyroculus", 3],
  ["lunarculus", 3],
  ["cryoculus", 2.5],
  ["crimson-agate", 1.5],
  ["lumenstone", 1.5],
  ["spirit-carp", 1.5],
  ["sacred-seal", 1],
  ["plume", 2],
  ["mnemonic-cluster", 2],
  ["utsava", 35],
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMemberRole(role) {
  return role === "member" || role === "staff" || role === "admin";
}

function getFarmPriceMap(role) {
  return isMemberRole(role) ? FARM_PRICES_MEMBER : FARM_PRICES_CUSTOMER;
}

const ALLOWED_FARM_DISCOUNTS = new Set([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);

async function getFarmGemDiscountPercent(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by UUID
      )
    `;
    const [row] = await sql`
      SELECT value
      FROM app_settings
      WHERE key = 'farm_gem_discount_percent'
      LIMIT 1
    `;
    const n = Number(row?.value);
    if (!Number.isFinite(n) || !ALLOWED_FARM_DISCOUNTS.has(n)) return 0;
    return n;
  } catch (err) {
    console.error("getFarmGemDiscountPercent", err);
    return 0;
  }
}

function applyFarmDiscount(basePrice, discountPercent) {
  const pct = Number(discountPercent) || 0;
  if (!pct || pct <= 0) return basePrice;
  return Math.max(1, Math.round(basePrice * (100 - pct) / 100));
}

function cleanText(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanStream(value) {
  return value === "yes" ? "yes" : "no";
}

function validateUploadPath(pathname, userId) {
  return isValidOrderUploadPath(pathname, userId || null);
}

function cleanGoogleDriveUrl(value) {
  const t = cleanText(value, 500);
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "drive.google.com" && host !== "docs.google.com") return null;
    return t;
  } catch {
    return null;
  }
}

function buildDetails(service, raw, userRole = "customer", farmDiscountPercent = 0) {
  const d = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const details = {
    prohibitions: cleanText(d.prohibitions, 1500),
    stream: cleanStream(d.stream),
  };

  const accountFields = {
    gameName: cleanText(d.gameName, 100) || null,
    server: cleanText(d.server, 40) || null,
    loginId: cleanText(d.loginId, 120) || null,
    gamePass: cleanText(d.gamePass, 200) || null,
    ar: d.ar != null && Number.isFinite(Number(d.ar)) ? Number(d.ar) : null,
    authMethod: cleanText(d.authMethod, 20) || "hoyoverse",
  };

  if (service === "farm-gem") {
    const gems = Number(d.gems);
    const priceMap = getFarmPriceMap(userRole);
    if (!priceMap.has(gems)) throw new Error("แพ็กเกจเจมไม่ถูกต้อง");
    const mapDriveUrl = cleanGoogleDriveUrl(d.mapDriveUrl || d.mapDriveLink);
    if (!mapDriveUrl) throw new Error("กรุณาวางลิงก์ Google Drive ที่รวมภาพแมพ");
    const rush = d.rush === true;
    const noDailyGems = d.noDailyGems === true;
    const noAbyssTheaterGems = d.noAbyssTheaterGems === true;
    const combat = d.combat === "cannot" ? "cannot" : "can";
    const authMethod = cleanText(d.authMethod, 20) || "hoyoverse";
    const listPrice = priceMap.get(gems);
    const discountPct = ALLOWED_FARM_DISCOUNTS.has(Number(farmDiscountPercent))
      ? Number(farmDiscountPercent)
      : 0;
    const basePrice = applyFarmDiscount(listPrice, discountPct);
    let total = rush ? Math.round(basePrice * 1.3) : basePrice;
    let extra = 0;
    if (noDailyGems) extra += 20;
    if (noAbyssTheaterGems) extra += 50;
    if (combat === "cannot") extra += 50;
    total += extra;
    const extraBits = [];
    if (noDailyGems) extraBits.push("ไม่นับเจมประจำวัน +20");
    if (noAbyssTheaterGems) extraBits.push("ไม่นับอบิส/โรงละคร +50");
    if (combat === "cannot") extraBits.push("ตีมอนไม่ไหว +50");
    const promoBit = discountPct > 0 ? ` · โปรลด ${discountPct}%` : "";
    return {
      details: {
        ...details,
        ...accountFields,
        gems,
        rush,
        noDailyGems,
        noAbyssTheaterGems,
        combat,
        authMethod,
        extraFees: extra,
        memberPrice: isMemberRole(userRole),
        mapDriveUrl,
        listPrice,
        discountPercent: discountPct,
        discountedBase: basePrice,
      },
      totalPrice: total,
      summary: `${gems.toLocaleString("en-US")} เจม${rush ? " (งานเร่ง)" : ""}${extraBits.length ? ` · ${extraBits.join(" · ")}` : ""}${isMemberRole(userRole) ? " · สมาชิก" : ""}${promoBit} · ${total}฿`,
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

  if (service === "abyss") {
    const ABYSS_PRICES = new Map([
      ["floor-9-10", 30],
      ["floor-9-11", 60],
      ["floor-9-12", 120],
      ["floor-11-12", 100],
      ["full-36", 170],
    ]);
    const packageId = cleanText(d.packageId || d.package, 40);
    const packageName = cleanText(d.package, 100);
    if (!packageId || !ABYSS_PRICES.has(packageId)) {
      throw new Error("แพ็กเกจ Abyss ไม่ถูกต้อง");
    }
    const total = ABYSS_PRICES.get(packageId);
    const detail = cleanText(d.detail, 1500);
    const label = packageName || packageId;
    return {
      details: { ...details, ...accountFields, packageId, package: label, detail },
      totalPrice: total,
      summary: `${label} · ${total}฿`,
    };
  }

  if (service === "explore") {
    const REGION_AREAS = {
      mondstadt: 6,
      liyue: 9,
      inazuma: 6,
      sumeru: 13,
      fontaine: 8,
      natlan: 9,
      "nod-krai": 7,
      enkanomiya: 3,
      chasm: 3,
      "sea-of-bygone": 3,
      "ancient-sacred-mountain": 6,
      "temple-of-space": 3,
      frostmoon: 3,
    };
    const packageId = cleanText(d.packageId || "", 60).toLowerCase();
    const packageName = cleanText(d.package, 100);
    const percent = Number(d.percent);
    const areaCount = Number(d.areaCount);
    const maxAreas = REGION_AREAS[packageId];
    if (!packageId || maxAreas == null) {
      throw new Error("พื้นที่สำรวจไม่ถูกต้อง");
    }
    if (![50, 75, 100].includes(percent)) {
      throw new Error("เปอร์เซ็นต์สำรวจต้องเป็น 50 / 75 / 100");
    }
    if (!Number.isInteger(areaCount) || areaCount < 1 || areaCount > maxAreas) {
      throw new Error(`จำนวนพื้นที่ต้องอยู่ระหว่าง 1–${maxAreas}`);
    }
    // 1% = 2 ฿ ต่อ 1 พื้นที่ → ราคา = พื้นที่ × % × 2
    const total = areaCount * percent * 2;
    const detail = cleanText(d.detail, 1500);
    const label = packageName || packageId;
    const mapDriveUrl = cleanGoogleDriveUrl(d.mapDriveUrl || d.mapDriveLink);
    if (!mapDriveUrl) throw new Error("กรุณาวางลิงก์ Google Drive ที่รวมภาพแมพ");
    return {
      details: {
        ...details,
        ...accountFields,
        packageId,
        package: label,
        areaCount,
        areaMax: maxAreas,
        percent,
        detail,
        mapDriveUrl,
      },
      totalPrice: total,
      summary: `${label} ${areaCount}/${maxAreas} พื้นที่ · ${percent}% · ${total}฿`,
    };
  }

  if (service === "oculus") {
    const itemsRaw = Array.isArray(d.items) ? d.items : [];
    const items = [];
    let subtotal = 0;
    for (const row of itemsRaw) {
      const id = cleanText(row?.id, 40).toLowerCase();
      const label = cleanText(row?.label, 80) || id;
      const remaining = Number(row?.remaining);
      const unit = OCULUS_UNIT_PRICES.get(id);
      if (unit == null) continue;
      if (!Number.isFinite(remaining) || remaining <= 0) continue;
      const qty = Math.min(9999, Math.floor(remaining));
      const lineTotal = Math.round(qty * unit * 100) / 100;
      subtotal += lineTotal;
      items.push({ id, label, remaining: qty, unitPrice: unit, lineTotal });
    }
    if (!items.length) throw new Error("กรุณาเลือกชนิด Oculus และจำนวนที่เหลืออย่างน้อย 1 รายการ");

    const noCompass = d.noCompass === true;
    const noMarkers = d.noMarkers === true;
    let extra = 0;
    if (noCompass) extra += 20;
    if (noMarkers) extra += 20;
    const total = Math.round((subtotal + extra) * 100) / 100;
    const note = cleanText(d.note, 1500);
    const names = items.map((it) => `${it.label}×${it.remaining}`).join(", ");
    const extraBits = [];
    if (noCompass) extraBits.push("ไม่มีเข็มทิศ +20");
    if (noMarkers) extraBits.push("ไม่มีมาร์ก +20");

    return {
      details: {
        ...details,
        ...accountFields,
        items,
        noCompass,
        noMarkers,
        note: note || null,
        subtotal,
        extraFees: extra,
      },
      totalPrice: total,
      summary: `Oculus · ${names}${extraBits.length ? ` · ${extraBits.join(" · ")}` : ""} · ${total}฿`,
    };
  }

  const packageName = cleanText(d.package, 100);
  if (!packageName) throw new Error("กรุณาเลือกแพ็กเกจหรือเป้าหมาย");
  const detail = cleanText(d.detail, 1500);
  return {
    details: { ...details, ...accountFields, package: packageName, detail },
    totalPrice: null,
    summary: packageName + (detail ? ` · ${detail}` : ""),
  };
}

async function handler(request) {
  try {
    const user = await getSessionUser(request);
    const sql = getSql();

    if (request.method === "GET") {
      const url = new URL(request.url);
      const wantQueue = url.searchParams.get("queue") === "1" || url.searchParams.get("view") === "queue";

      // ตารางคิวสาธารณะ — ทุกคนดูได้ (ไม่มีสลิป / ภาพแนบ / รหัสผ่าน)
      if (wantQueue || !user || (user.role !== "admin" && user.role !== "staff")) {
        // admin/staff ที่ไม่ขอ queue ยังได้ข้อมูลเต็มด้านล่าง
        if (wantQueue || !user || user.role === "customer" || user.role === "member") {
          const orders = await sql`
            SELECT
              o.order_number AS "orderNumber",
              o.service,
              o.summary,
              o.facebook_name AS "facebookName",
              o.game_username AS "gameUsername",
              o.status,
              o.total_price AS "totalPrice",
              o.created_at AS "createdAt"
            FROM orders o
            ORDER BY o.created_at DESC
            LIMIT 300
          `;
          return json({ orders, public: true });
        }
      }

      if (!user) return json({ error: "กรุณาเข้าสู่ระบบก่อน" }, 401);
      let orders;
      if (user.role === "admin") {
        orders = await sql`
          SELECT
            o.id::text AS id,
            o.order_number AS "orderNumber",
            o.service,
            o.summary,
            u.email AS "customerEmail",
            u.display_name AS "customerDisplayName",
            o.facebook_name AS "facebookName",
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
          LEFT JOIN users u ON u.id = o.customer_id
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
            u.display_name AS "customerDisplayName",
            o.facebook_name AS "facebookName",
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
          LEFT JOIN users u ON u.id = o.customer_id
          LEFT JOIN users s ON s.id = o.assigned_staff_id
          WHERE o.assigned_staff_id = ${user.id}
          ORDER BY o.created_at DESC
          LIMIT 200
        `;
      } else {
        // fallback คิวสาธารณะ
        orders = await sql`
          SELECT
            o.order_number AS "orderNumber",
            o.service,
            o.summary,
            o.facebook_name AS "facebookName",
            o.game_username AS "gameUsername",
            o.status,
            o.total_price AS "totalPrice",
            o.created_at AS "createdAt"
          FROM orders o
          ORDER BY o.created_at DESC
          LIMIT 300
        `;
        return json({ orders, public: true });
      }
      return json({ orders });
    }

    if (request.method === "POST") {
      assertSameOrigin(request);
      // สั่งซื้อได้โดยไม่ล็อกอิน — ห้ามเฉพาะบัญชี staff
      if (user?.role === "staff") {
        return json({ error: "บัญชีลูกทีมไม่สามารถสั่งซื้อผ่านระบบนี้ได้" }, 403);
      }

      const body = await request.json();
      const service = cleanText(body.service, 30);
      if (!ALLOWED_SERVICES.has(service)) return json({ error: "ไม่พบบริการนี้" }, 400);

      const gameUsername = cleanText(body.gameUsername, 100);
      const gameUid = cleanText(body.gameUid, 40);
      if (!gameUsername || !gameUid) return json({ error: "กรุณากรอก Username และ UID ให้ครบ" }, 400);

      const facebookName = cleanText(body.facebookName, 80);
      if (!facebookName || facebookName.length < 2) {
        return json({ error: "กรุณากรอกชื่อเฟสเพื่อยืนยันตัวตน" }, 400);
      }

      const userId = user?.id || null;
      const slipPath = cleanText(body.slipPath, 500);
      const attachmentPath = body.attachmentPath ? cleanText(body.attachmentPath, 500) : null;
      if (!validateUploadPath(slipPath, userId)) return json({ error: "กรุณาอัปโหลดสลิปใหม่" }, 400);
      if (service === "material" && !validateUploadPath(attachmentPath, userId)) {
        return json({ error: "กรุณาอัปโหลดภาพวัสดุใหม่" }, 400);
      }
      // farm-gem / explore ใช้ลิงก์ Google Drive ใน details.mapDriveUrl แทนการอัปโหลดภาพ
      if (service === "build-char" && attachmentPath && !validateUploadPath(attachmentPath, userId)) {
        return json({ error: "ไฟล์แนบไม่ถูกต้อง" }, 400);
      }
      if (attachmentPath && service !== "farm-gem" && service !== "explore" && !validateUploadPath(attachmentPath, userId)) {
        return json({ error: "ไฟล์แนบไม่ถูกต้อง" }, 400);
      }

      const farmDiscountPercent =
        service === "farm-gem" ? await getFarmGemDiscountPercent(sql) : 0;
      const normalized = buildDetails(
        service,
        body.details,
        user?.role || "customer",
        farmDiscountPercent
      );
      const [order] = await sql`
        INSERT INTO orders (
          customer_id, service, summary, game_username, game_uid, facebook_name,
          status, total_price, details, slip_path, attachment_path
        ) VALUES (
          ${userId}, ${service}, ${normalized.summary}, ${gameUsername}, ${gameUid}, ${facebookName},
          'pending', ${normalized.totalPrice}, ${JSON.stringify(normalized.details)}::jsonb,
          ${slipPath}, ${attachmentPath}
        )
        RETURNING id::text AS id, order_number AS "orderNumber", service,
          summary, game_username AS "gameUsername", game_uid AS uid,
          facebook_name AS "facebookName",
          status, total_price AS "totalPrice", created_at AS "createdAt"
      `;

      // แจ้งเตือน LINE + Discord (ไม่บล็อกการสร้างออเดอร์ถ้าส่งไม่สำเร็จ)
      try {
        const mapDriveUrl =
          (normalized.details && (normalized.details.mapDriveUrl || normalized.details.mapDriveLink)) || null;
        const isMapService = service === "farm-gem" || service === "explore";
        const attachmentLabel = isMapService
          ? "ดูแมพ (Google Drive)"
          : service === "material"
            ? "ดูภาพวัสดุ"
            : service === "build-char"
              ? "ดูภาพตัวละคร"
              : "ดูภาพแนบ";
        const attachmentViewUrl = isMapService && mapDriveUrl
          ? mapDriveUrl
          : attachmentPath
            ? buildAttachmentViewUrl(request, attachmentPath)
            : null;

        await notifyNewOrderAll({
          orderNumber: order.orderNumber,
          service: order.service,
          summary: order.summary,
          gameUsername: order.gameUsername,
          gameUid: order.uid,
          customerName: facebookName,
          customerEmail: user?.email || "",
          totalPrice: order.totalPrice,
          attachmentViewUrl,
          attachmentLabel,
          attachmentPath: isMapService ? null : attachmentPath,
        });
      } catch (notifyError) {
        console.error("[notify] notifyNewOrderAll failed", notifyError);
      }

      return json({ success: true, order }, 201);
    }

    if (request.method === "PATCH") {
      assertSameOrigin(request);
      if (!user) return json({ error: "กรุณาเข้าสู่ระบบก่อน" }, 401);
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
    const msg = String(error?.message || "");
    const validationMessages = new Set([
      "แพ็กเกจเจมไม่ถูกต้อง",
      "กรุณาเลือกตัวละคร",
      "กรุณาเลือกประเภทวัสดุ",
      "กรุณาระบุรายละเอียดวัสดุที่ต้องการ",
      "กรุณาเลือกเป้าหมายการปั้น",
      "กรุณาเลือกแพ็กเกจหรือเป้าหมาย",
      "แพ็กเกจ Abyss ไม่ถูกต้อง",
      "พื้นที่สำรวจไม่ถูกต้อง",
      "เปอร์เซ็นต์สำรวจต้องเป็น 50 / 75 / 100",
      "กรุณาเลือกชนิด Oculus และจำนวนที่เหลืออย่างน้อย 1 รายการ",
    ]);
    // ข้อความจำนวนพื้นที่แบบ dynamic
    if (/^จำนวนพื้นที่ต้องอยู่ระหว่าง/.test(msg)) {
      return json({ error: msg }, 400);
    }
    if (validationMessages.has(msg)) {
      return json({ error: msg }, 400);
    }
    // Neon CHECK constraint — มักเกิดเมื่อยังไม่รัน migration เพิ่ม service ใหม่
    if (
      /orders_service/i.test(msg) ||
      /violates check constraint/i.test(msg) ||
      /check constraint/i.test(msg)
    ) {
      console.error("[orders] service constraint", error);
      return json(
        {
          error:
            "บริการนี้ยังไม่เปิดในฐานข้อมูล — ให้รัน sql/add_oculus_service.sql ใน Neon แล้วลองใหม่",
        },
        500
      );
    }
    return json({ error: errorMessage(error, "ไม่สามารถบันทึกข้อมูลออเดอร์ได้") }, error.status || 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
