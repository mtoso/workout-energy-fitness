-- Default bootstrap superadmin
-- Email: admin@example.com
-- Password: ChangeMe123! (change immediately after first login)

INSERT OR IGNORE INTO users (id, email, role, is_active)
VALUES ('superadmin-seed', 'admin@example.com', 'admin', 1);

INSERT OR IGNORE INTO user_identities (
  id,
  user_id,
  provider,
  provider_subject,
  email_verified,
  last_login_at
)
VALUES (
  'superadmin-seed-email-identity',
  'superadmin-seed',
  'email',
  'admin@example.com',
  1,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO email_credentials (user_id, password_hash)
VALUES (
  'superadmin-seed',
  'argon2id$v=1$m=19456,t=3,p=1$DuUXJNFw5i41AsJrFupYnQ$jy_7zP2umFjcfPS2jI5nUvvI1SHiV9N4hzAy7h0t45s'
);
