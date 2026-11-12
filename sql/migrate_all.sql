-- =============================================================================
-- Dozo Genshin — รวม migration ทั้งหมด (รันครั้งเดียวใน Neon SQL Editor)
-- ใช้กับฐานข้อมูลที่มีตาราง users / orders อยู่แล้ว
-- รันซ้ำได้ (idempotent) — ไม่ลบข้อมูลเดิม
--
-- ครอบคลุม:
--   • role: customer / member / staff / admin
--   • คอลัมน์สมาชิก (membership_slip_path, member_since)
--   • คอลัมน์ลูกทีม (staff_title, staff_description)
--   • ออเดอร์ไม่ล็อกอิน (customer_id nullable + facebook_name)
--   • มอบหมายงานให้ลูกทีม (assigned_staff_id)
--   • บริการ: farm-gem, material, build-char, abyss, explore, oculus
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) users: บทบาท + คอลัมน์สมาชิก / ลูกทีม
-- ---------------------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer', 'member', 'staff', 'admin'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS staff_title TEXT,
  ADD COLUMN IF NOT EXISTS staff_description TEXT,
  ADD COLUMN IF NOT EXISTS membership_slip_path TEXT,
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 2) orders: ออเดอร์ไม่ล็อกอิน + ชื่อเฟส
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS facebook_name TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_facebook_name
  ON orders (facebook_name)
  WHERE facebook_name IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) orders: มอบหมายงานให้ลูกทีม
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_created
  ON orders (assigned_staff_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4) orders: รายการบริการที่อนุญาต (รวม oculus)
--    ดรอปชื่อ constraint เก่าทุกแบบ แล้วสร้างใหม่ชื่อเดียว
-- ---------------------------------------------------------------------------
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_allowed_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_service_check
  CHECK (service IN (
    'farm-gem',
    'material',
    'build-char',
    'abyss',
    'explore',
    'oculus'
  ));

COMMIT;

-- เสร็จแล้ว — ลองสั่งบริการ Oculus บนเว็บได้อีกครั้ง
-- (ถ้าต้องการตั้งแอดมิน: UPDATE users SET role = 'admin' WHERE email = lower('your@email.com');)
