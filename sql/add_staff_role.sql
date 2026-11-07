-- Dozo2: เพิ่ม role staff และข้อมูลแสดงผลลูกทีม
-- ใช้กับฐานข้อมูลที่สร้าง users/orders ตาม schema เดิมแล้ว
-- รันใน Neon Console -> SQL Editor ได้หนึ่งครั้ง (หรือรันซ้ำได้อย่างปลอดภัย)

BEGIN;

-- CHECK ที่เขียน inline ใน CREATE TABLE users เดิมจะชื่อ users_role_check
-- ลบชื่อ migration เก่าด้วย เพื่อให้ไฟล์นี้รันซ้ำได้
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_allowed_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_allowed_check
  CHECK (role IN ('customer', 'staff', 'admin'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS staff_title TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS staff_description TEXT;

COMMIT;

-- หมายเหตุ:
-- สมัครสมาชิกใหม่จะยังได้ role = 'customer' ตามเดิม
-- แอดมินสามารถกำหนด role = 'staff' ผ่านหน้า แอดมิน -> ลูกทีม
-- หรือใช้ SQL ตัวอย่างนี้เพื่อทดสอบ โดยใส่อีเมลที่สมัครไว้แล้ว:
-- UPDATE users
-- SET role = 'staff', staff_title = 'ทีมฟาร์มเจม',
--     staff_description = 'รับงาน Primogem / Mora'
-- WHERE email = lower('staff@example.com') AND role = 'customer';
