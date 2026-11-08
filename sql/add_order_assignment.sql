-- Dozo2: มอบหมายออเดอร์ให้ลูกทีม (staff)
-- รันใน Neon Console -> SQL Editor ได้หนึ่งครั้ง (รันซ้ำได้ปลอดภัย)

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_created
  ON orders (assigned_staff_id, created_at DESC);

COMMIT;

-- หมายเหตุ:
-- assigned_staff_id = NULL หมายถึงยังไม่ส่งมอบงาน
-- แอดมินเป็นคนมอบหมายเท่านั้น
-- staff เห็นเฉพาะออเดอร์ที่ถูกมอบหมายให้ตัวเอง และอัปเดตสถานะได้หลังถูกมอบหมายแล้ว
