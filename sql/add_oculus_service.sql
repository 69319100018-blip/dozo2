-- เพิ่มบริการเก็บ Oculus / อัปเสาเมือง
-- รันใน Neon Console → SQL Editor

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_check;

ALTER TABLE orders ADD CONSTRAINT orders_service_check
  CHECK (service IN ('farm-gem', 'material', 'build-char', 'abyss', 'explore', 'oculus'));
