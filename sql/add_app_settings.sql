-- =============================================================================
-- Dozo Genshin — ตารางตั้งค่าระบบ (เช่น ลดราคาฟาร์มเจม)
-- รันครั้งเดียวใน Neon Console → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ค่าเริ่มต้น: ไม่ลดราคา
INSERT INTO app_settings (key, value)
VALUES ('farm_gem_discount_percent', '0')
ON CONFLICT (key) DO NOTHING;
