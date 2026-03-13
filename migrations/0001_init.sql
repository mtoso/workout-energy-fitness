PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'coach')),
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'disabled')),
  coach_user_id TEXT,
  invited_by_user_id TEXT,
  invite_token_hash TEXT UNIQUE,
  invite_expires_at TEXT,
  invited_at TEXT,
  activated_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (user_type = 'client' OR coach_user_id IS NULL)
);

CREATE TABLE IF NOT EXISTS user_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('email', 'google')),
  provider_subject TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT,
  UNIQUE(provider, provider_subject),
  UNIQUE(user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_credentials (
  user_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS body_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  weight REAL NOT NULL,
  body_fat REAL,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  created_by_user_id TEXT,
  updated_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workout_weeks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  week_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  UNIQUE(plan_id, week_order)
);

CREATE TABLE IF NOT EXISTS workout_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  week_id TEXT NOT NULL,
  day_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  focus TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (week_id) REFERENCES workout_weeks(id) ON DELETE CASCADE,
  UNIQUE(week_id, day_order)
);

CREATE TABLE IF NOT EXISTS workout_exercise_groups (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL,
  group_order INTEGER NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('single', 'superset')),
  sets INTEGER NOT NULL,
  rest TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (day_id) REFERENCES workout_days(id) ON DELETE CASCADE,
  UNIQUE(day_id, group_order)
);

CREATE TABLE IF NOT EXISTS workout_exercise_group_items (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  reps TEXT NOT NULL,
  previous_weight TEXT,
  previous_reps TEXT,
  previous_date TEXT,
  FOREIGN KEY (group_id) REFERENCES workout_exercise_groups(id) ON DELETE CASCADE,
  UNIQUE(group_id, item_order)
);

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_coach_user_id ON users(coach_user_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_token_hash ON users(invite_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_body_checkins_user_id ON body_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_body_checkins_recorded_at ON body_checkins(recorded_at);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_weeks_plan_id ON workout_weeks(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_plan_id ON workout_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_week_id ON workout_days(week_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_groups_day_id ON workout_exercise_groups(day_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_items_group_id ON workout_exercise_group_items(group_id);
