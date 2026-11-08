-- Dozo2: เพิ่มบริการ build-char (ปั้นตัวละคร)
-- รันใน Neon Console -> SQL Editor ได้หนึ่งครั้ง (รันซ้ำได้ปลอดภัย)

BEGIN;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_allowed_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_service_allowed_check
  CHECK (service IN ('farm-gem', 'material', 'build-char', 'abyss', 'explore'));

COMMIT;
