INSERT OR IGNORE INTO users (
  id,
  email,
  full_name,
  user_type,
  is_admin,
  status,
  coach_user_id,
  activated_at
)
VALUES (
  '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1',
  'mattia.toso@gmail.com',
  'Mattia Toso',
  'client',
  0,
  'active',
  '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d',
  CURRENT_TIMESTAMP
);
