-- อนุญาตออเดอร์แบบไม่ล็อกอิน + เก็บชื่อเฟสยืนยันตัวตน
-- รันใน Neon Console → SQL Editor

ALTER TABLE orders
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS facebook_name TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_facebook_name
  ON orders (facebook_name)
  WHERE facebook_name IS NOT NULL;
