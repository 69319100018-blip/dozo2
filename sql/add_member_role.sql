-- Add member role for paid membership (50 THB) with discounted farm rates.
-- Safe to run on existing databases.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('customer', 'member', 'staff', 'admin'));

-- Optional: track membership payment slip path
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS membership_slip_path TEXT,
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ;
