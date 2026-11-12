-- =============================================================================
-- Dozo Genshin / Dozo2 — Schema ล่าสุด (ฐานข้อมูลใหม่)
-- รันครั้งเดียวใน Neon Console → SQL Editor
-- ถ้ามีฐานเดิมอยู่แล้ว ให้ใช้ migrate_all.sql แทน
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'member', 'staff', 'admin')),
  staff_title TEXT,
  staff_description TEXT,
  membership_slip_path TEXT,
  member_since TIMESTAMPTZ,
  -- Discord User ID สำหรับคำสั่ง /รับงาน (ลูกทีม / แอดมิน)
  discord_user_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  -- null = ออเดอร์จากผู้ใช้ที่ไม่ล็อกอิน
  customer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  service TEXT NOT NULL
    CHECK (service IN (
      'farm-gem',
      'material',
      'build-char',
      'abyss',
      'explore',
      'oculus'
    )),
  summary TEXT NOT NULL,
  game_username TEXT NOT NULL,
  game_uid TEXT NOT NULL,
  -- ชื่อ Facebook ใช้ยืนยันตัวตน (บังคับตอนสั่งซื้อ)
  facebook_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'doing', 'done', 'cancel')),
  total_price NUMERIC(10,2),
  currency CHAR(3) NOT NULL DEFAULT 'THB',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  slip_path TEXT NOT NULL,
  attachment_path TEXT,
  assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_service_created
  ON orders (service, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_created
  ON orders (assigned_staff_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_facebook_name
  ON orders (facebook_name)
  WHERE facebook_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_discord_user_id
  ON users (discord_user_id)
  WHERE discord_user_id IS NOT NULL;

-- ตั้งแอดมินหลังสมัครผ่านเว็บแล้ว:
-- UPDATE users SET role = 'admin' WHERE email = lower('your-email@example.com');
--
-- ผูก Discord สำหรับ /รับงาน:
-- UPDATE users SET discord_user_id = 'DISCORD_USER_ID'
-- WHERE email = lower('staff@example.com') AND role IN ('staff', 'admin');
