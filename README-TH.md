# Dozo Genshin — Neon + Vercel Setup

ชุดนี้เปลี่ยนหน้าเว็บเดิมให้ใช้ Neon ผ่าน Vercel Functions ภายในโปรเจกต์เดียวกัน และใช้ Vercel Blob แบบ Private เก็บรูปสลิป/ภาพวัสดุ

## โครงสร้างไฟล์

```text
project-root/
├── index.html
├── package.json
├── css/
│   └── style.css
├── js/
│   ├── api.js
│   └── app.js
├── api/
│   ├── auth.js
│   ├── orders.js
│   ├── team.js
│   └── upload.js
├── lib/
│   └── server.js
└── sql/
    ├── neon_schema.sql
    └── add_staff_role.sql
```

ให้นำไฟล์จาก ZIP ไปวางทับ/รวมใน Root Directory ของโปรเจกต์ `dozo2` บน GitHub ที่เชื่อมกับ Vercel อย่าลบไฟล์ภาพเดิมของเว็บ โดยเฉพาะ `assets/qr-promptpay.jpg` และไฟล์อื่นในโฟลเดอร์ `assets/` เพราะไม่ได้อยู่ในชุดไฟล์ที่ส่งมาครั้งนี้

## 1) สร้างตารางใน Neon

1. เปิด Neon Console แล้วเลือกโปรเจกต์ฐานข้อมูล `neon-dozo`
2. เข้า SQL Editor
3. ถ้าเป็นฐานข้อมูลใหม่ ให้เปิดไฟล์ `sql/neon_schema.sql` ในชุดนี้ แล้วคัดลอกเนื้อหาทั้งหมดไป Run
4. **ถ้าคุณมีฐานข้อมูลเดิมตาม SQL ที่ใช้งานอยู่แล้ว ห้ามรัน `neon_schema.sql` ซ้ำ** ให้รันเฉพาะ `sql/add_staff_role.sql` เพื่อเพิ่ม role `staff` และคอลัมน์ `staff_title` / `staff_description`

สคริปต์สร้างฐานข้อมูลใหม่จะสร้างตาราง `users` และ `orders` ส่วน migration สำหรับฐานข้อมูลเดิมจะเพิ่มความสามารถลูกทีมโดยไม่ลบข้อมูลเดิม

## 2) ตั้งค่า Environment Variables ใน Vercel

ใน Vercel → Project `dozo2` → Settings → Environment Variables ตรวจสอบว่า `DATABASE_URL` มีอยู่แล้ว (จาก Neon Integration) จากนั้นเพิ่มตัวแปรใหม่:

- `SESSION_SECRET` — สุ่มค่า Secret อย่างน้อย 32 ตัวอักษร แนะนำ 64 ตัวอักษรแบบ hex

สร้างค่าสุ่มได้จาก Terminal ที่ติดตั้ง Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

คัดลอกผลลัพธ์ไปใส่ Value ของ `SESSION_SECRET` สำหรับ Production และ Preview ตามสภาพแวดล้อมที่ใช้งาน ห้ามใส่ Secret ลงในไฟล์ JavaScript หรือ GitHub

## 3) สร้าง Private Blob Store สำหรับไฟล์ภาพ

รูปสลิปมีข้อมูลส่วนตัว จึงไม่ใช้ Public Blob และไม่เก็บภาพเป็น Base64 ในตาราง Neon

1. เปิด Vercel โปรเจกต์ `dozo2`
2. เข้า Storage → Create Storage → Blob
3. เลือก Access เป็น **Private**
4. สร้าง Store และเชื่อมกับโปรเจกต์ `dozo2`
5. ตรวจสอบว่าตัวแปร/การเชื่อมต่อของ Blob Store ถูกผูกกับโปรเจกต์เรียบร้อยแล้ว

โค้ดอัปโหลดและอ่านไฟล์ใช้ `@vercel/blob` Private Storage SDK ส่วน Neon จะเก็บเฉพาะ `pathname` ของไฟล์

## 4) Deploy

1. วาง `api/`, `lib/`, `sql/`, `css/`, `js/`, `package.json` และ `index.html` ไว้ที่ Root Directory เดียวกัน
2. คง `assets/` เดิมของเว็บไซต์ไว้
3. Commit และ Push ไปยัง GitHub Repository ที่เชื่อมกับ Vercel
4. รอ Deployment สำเร็จ แล้วเปิดเว็บไซต์ของโปรเจกต์เดิม

Vercel จะติดตั้งแพ็กเกจจาก `package.json` และสร้าง Functions จากไฟล์ในโฟลเดอร์ `api/` อัตโนมัติ

## 5) สร้างบัญชีแอดมิน

1. เปิดเว็บ Dozo2 แล้วเลือก “สมัครสมาชิก” เพื่อสร้างบัญชีเจ้าของร้านด้วยอีเมลของคุณ
2. เข้า Neon → SQL Editor แล้วรันคำสั่งนี้ โดยแทนอีเมลตัวอย่างด้วยอีเมลที่เพิ่งสมัคร:

```sql
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = lower('your-email@example.com');
```

3. ออกจากระบบแล้วเข้าสู่ระบบใหม่ เมนูแอดมินจะปรากฏเมื่อระบบอ่าน role = `admin`

อย่าเปิดสิทธิ์แอดมินด้วยการแก้ JavaScript ฝั่งหน้าเว็บ เพราะสิทธิ์จริงตรวจสอบจากฐานข้อมูลใน API ทุกครั้ง

## 6) ระบบลูกทีม (role = staff)

ผู้สมัครสมาชิกใหม่ทุกคนยังได้รับ `role = customer` ตามเดิม ไม่มีตัวเลือกสมัครเป็น staff เพื่อป้องกันไม่ให้บุคคลทั่วไปยกระดับสิทธิ์ตัวเอง

1. ให้ลูกทีมสมัครสมาชิกผ่านหน้าเว็บตามปกติก่อน
2. เข้าบัญชีแอดมิน แล้วเปิด **แอดมิน → ลูกทีม**
3. เลือกบัญชีสมาชิกที่สมัครไว้แล้ว กำหนดตำแหน่งและรายละเอียดงาน แล้วกด **เพิ่มเป็นลูกทีม**
4. ระบบจะเปลี่ยน role เป็น `staff` และแสดงบัญชีนั้นในรายชื่อลูกทีมจาก Neon
5. หากต้องการถอดออก ให้กด **นำออกจากทีม** ระบบจะเปลี่ยน role กลับเป็น `customer`

การ์ดลูกทีมจะแสดงเฉพาะผู้ใช้ที่มี `role = staff` ไม่ใช้รายชื่อคงที่ Dozo, Aoi, Rin, Kai และ Mika ใน JavaScript อีกต่อไป บัญชี `admin` จะไม่ปรากฏในลูกทีม และ `staff` ไม่ได้รับสิทธิ์แอดมินหรือสิทธิ์จัดการออเดอร์ทั้งหมด

หากต้องการเพิ่มลูกทีมผ่าน SQL โดยตรง สามารถใช้คำสั่งนี้หลังจากบัญชีนั้นสมัครสมาชิกแล้ว:

```sql
UPDATE users
SET role = 'staff',
    staff_title = 'ทีมฟาร์มเจม',
    staff_description = 'รับงาน Primogem / Mora'
WHERE email = lower('staff@example.com')
  AND role = 'customer';
```

## 7) API ที่เพิ่มเข้ามา

- `GET /api/auth` — ตรวจสอบ Session ปัจจุบัน
- `POST /api/auth` — สมัครสมาชิก, เข้าสู่ระบบ และออกจากระบบ
- `GET /api/orders` — ลูกค้าดูเฉพาะออเดอร์ของตัวเอง; แอดมินดูออเดอร์ทั้งหมด
- `GET /api/team` — แอดมินดูรายชื่อลูกทีม (`staff`) และบัญชีที่ยังเป็นลูกค้า
- `PATCH /api/team` — แอดมินเพิ่มลูกทีม (`customer` → `staff`) หรือนำออก (`staff` → `customer`)
- `POST /api/orders` — สร้างออเดอร์
- `PATCH /api/orders?id=...` — แอดมินเปลี่ยนสถานะออเดอร์
- `POST /api/upload` — อัปโหลดภาพไปยัง Private Blob
- `GET /api/upload?pathname=...` — อ่านไฟล์ได้เฉพาะเจ้าของออเดอร์หรือแอดมิน

## 8) ข้อควรทราบและข้อจำกัด

- เว็บเวอร์ชันนี้ใช้ระบบสมาชิกที่เก็บรหัสผ่านแบบ hash ด้วย scrypt และ Session ใน HttpOnly cookie ไม่ได้ใช้ Firebase Auth เดิม
- ไม่มีระบบยืนยันอีเมลหรือรีเซ็ตรหัสผ่านในชุดนี้ ควรเพิ่มก่อนเปิดให้ผู้ใช้ทั่วไปจำนวนมาก
- เว็บไซต์จะไม่ขอหรือส่งรหัสผ่านบัญชีเกม และฐานข้อมูลไม่มีคอลัมน์สำหรับรหัสผ่านบัญชีเกม
- ราคา Farm Gem คำนวณฝั่งเซิร์ฟเวอร์จากเรทราคาใน `app.js`/`api/orders.js` ส่วน Material, Abyss และ Explore บันทึก `total_price` เป็น NULL เพราะหน้าเว็บเดิมยังไม่มีราคายืนยันสำหรับบริการเหล่านั้น
- รับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 3 MB ต่อไฟล์
- ยังไม่ได้ทดสอบการเชื่อมต่อกับฐานข้อมูลจริงของเจ้าของโปรเจกต์ เพราะไม่มีสิทธิ์เข้าถึง Neon/Vercel ของเจ้าของบัญชีจากชุดไฟล์นี้ ต้อง Run SQL และ Deploy ในบัญชีของคุณก่อนทดสอบจริง
