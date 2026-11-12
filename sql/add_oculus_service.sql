-- เพิ่มบริการเก็บ Oculus / อัปเสาเมือง
-- รันใน Neon Console → SQL Editor (รันซ้ำได้)
--
-- สำคัญ: migration ปั้นตัวละครเคยตั้งชื่อ constraint เป็น orders_service_allowed_check
-- ต้องดรอปทั้งสองชื่อ แล้วสร้างใหม่ให้รวม oculus

BEGIN;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_allowed_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_service_check
  CHECK (service IN ('farm-gem', 'material', 'build-char', 'abyss', 'explore', 'oculus'));

COMMIT;
