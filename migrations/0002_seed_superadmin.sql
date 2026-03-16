-- Default bootstrap admin
-- Email: admin@example.com
-- Password: ChangeMe123! (change immediately after first login)
-- Stable seed UUIDs keep admin URLs opaque and consistent with non-seeded users.

INSERT OR IGNORE INTO users (
  id,
  email,
  full_name,
  user_type,
  is_admin,
  status,
  activated_at,
  last_login_at
)
VALUES (
  '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d',
  'admin@example.com',
  'EnergyFit Admin',
  'coach',
  1,
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO user_identities (
  id,
  user_id,
  provider,
  provider_subject,
  email_verified,
  last_login_at
)
VALUES (
  '8e6b46a9-34cc-4c77-9b26-5c3c6d5be98d',
  '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d',
  'email',
  'admin@example.com',
  1,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO email_credentials (user_id, password_hash)
VALUES (
  '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d',
  'argon2id$v=1$m=19456,t=3,p=1$DuUXJNFw5i41AsJrFupYnQ$jy_7zP2umFjcfPS2jI5nUvvI1SHiV9N4hzAy7h0t45s'
);
