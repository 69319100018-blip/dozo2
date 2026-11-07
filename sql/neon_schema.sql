-- Dozo Genshin / Dozo2
-- Run this script once in Neon Console -> SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service TEXT NOT NULL
    CHECK (service IN ('farm-gem', 'material', 'abyss', 'explore')),
  summary TEXT NOT NULL,
  game_username TEXT NOT NULL,
  game_uid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'doing', 'done', 'cancel')),
  total_price NUMERIC(10,2),
  currency CHAR(3) NOT NULL DEFAULT 'THB',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  slip_path TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_service_created
  ON orders (service, created_at DESC);

-- After a customer has registered through the website, promote that account
-- to admin by replacing the email below with the exact registered email.
-- UPDATE users SET role = 'admin' WHERE email = lower('your-email@example.com');
