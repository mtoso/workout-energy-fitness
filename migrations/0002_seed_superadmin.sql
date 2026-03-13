-- Default bootstrap admin
-- Email: admin@example.com
-- Password: ChangeMe123! (change immediately after first login)

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
  'admin-seed',
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
  'admin-seed-email-identity',
  'admin-seed',
  'email',
  'admin@example.com',
  1,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO email_credentials (user_id, password_hash)
VALUES (
  'admin-seed',
  'argon2id$v=1$m=19456,t=3,p=1$DuUXJNFw5i41AsJrFupYnQ$jy_7zP2umFjcfPS2jI5nUvvI1SHiV9N4hzAy7h0t45s'
);
