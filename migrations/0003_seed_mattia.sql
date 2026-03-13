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
  'mattia-seed',
  'mattia.toso@gmail.com',
  'Mattia Toso',
  'client',
  0,
  'active',
  'admin-seed',
  CURRENT_TIMESTAMP
);
