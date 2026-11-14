-- =============================================================================
-- Dozo Genshin / Dozo2 — รวม migration ทั้งหมด (ฐานข้อมูลที่มีอยู่แล้ว)
-- รันครั้งเดียวใน Neon Console → SQL Editor
-- รันซ้ำได้ (idempotent) — ไม่ลบข้อมูลเดิม
--
-- ครอบคลุม:
--   • role: customer / member / staff / admin
--   • คอลัมน์สมาชิก (membership_slip_path, member_since)
--   • คอลัมน์ลูกทีม (staff_title, staff_description)
--   • Discord staff claim (discord_user_id)
--   • ออเดอร์ไม่ล็อกอิน (customer_id nullable + facebook_name)
--   • มอบหมายงานให้ลูกทีม (assigned_staff_id)
--   • บริการ: farm-gem, material, build-char, abyss, explore, oculus
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) users: บทบาท + คอลัมน์สมาชิก / ลูกทีม / Discord
-- ---------------------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer', 'member', 'staff', 'admin'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS staff_title TEXT,
  ADD COLUMN IF NOT EXISTS staff_description TEXT,
  ADD COLUMN IF NOT EXISTS membership_slip_path TEXT,
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_discord_user_id_key'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_discord_user_id_key UNIQUE (discord_user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN unique_violation THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_discord_user_id
  ON users (discord_user_id)
  WHERE discord_user_id IS NOT NULL;

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

-- ---------------------------------------------------------------------------
-- 5) app_settings — เก็บค่าลดราคาฟาร์มเจม ฯลฯ (ปรับจากแอดมินได้โดยไม่ต้อง deploy)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO app_settings (key, value)
VALUES ('farm_gem_discount_percent', '0')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- -----------------------------------------------------------------------------
-- คำสั่งเสริม (รันแยกตามต้องการ)
-- -----------------------------------------------------------------------------
-- ตั้งแอดมิน:
-- UPDATE users SET role = 'admin' WHERE email = lower('your@email.com');
--
-- ผูก Discord สำหรับ /รับงาน:
-- UPDATE users
-- SET discord_user_id = '123456789012345678'
-- WHERE email = lower('staff@example.com')
--   AND role IN ('staff', 'admin');
--
-- ตรวจโครงสร้าง:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('users', 'orders')
-- ORDER BY table_name, ordinal_position;
