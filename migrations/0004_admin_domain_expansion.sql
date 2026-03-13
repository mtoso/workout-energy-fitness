PRAGMA foreign_keys = ON;

ALTER TABLE invites ADD COLUMN full_name TEXT;
ALTER TABLE invites ADD COLUMN coach_user_id TEXT;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coach_assignments (
  customer_user_id TEXT PRIMARY KEY,
  coach_user_id TEXT NOT NULL,
  assigned_by_user_id TEXT,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL
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

CREATE TABLE IF NOT EXISTS workout_weeks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  week_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
  UNIQUE(plan_id, week_order)
);

ALTER TABLE workout_days ADD COLUMN week_id TEXT;

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

INSERT INTO user_profiles (user_id)
SELECT u.id
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

INSERT INTO workout_weeks (id, plan_id, week_order, name)
SELECT 'week_' || substr(p.id, 1, 12), p.id, 1, 'Settimana 1'
FROM workout_plans p
LEFT JOIN workout_weeks w ON w.plan_id = p.id AND w.week_order = 1
WHERE w.id IS NULL;

UPDATE workout_days
SET week_id = (
  SELECT w.id
  FROM workout_weeks w
  WHERE w.plan_id = workout_days.plan_id
    AND w.week_order = 1
)
WHERE week_id IS NULL;

INSERT INTO workout_exercise_groups (
  id,
  day_id,
  group_order,
  group_type,
  sets,
  rest,
  notes
)
SELECT
  'grp_' || e.id,
  e.day_id,
  e.exercise_order,
  'single',
  e.sets,
  e.rest,
  e.trainer_note
FROM workout_exercises e
LEFT JOIN workout_exercise_groups g ON g.id = 'grp_' || e.id
WHERE g.id IS NULL;

INSERT INTO workout_exercise_group_items (
  id,
  group_id,
  item_order,
  name,
  reps,
  previous_weight,
  previous_reps,
  previous_date
)
SELECT
  'item_' || e.id,
  'grp_' || e.id,
  1,
  e.name,
  e.reps,
  e.previous_weight,
  e.previous_reps,
  e.previous_date
FROM workout_exercises e
LEFT JOIN workout_exercise_group_items i ON i.id = 'item_' || e.id
WHERE i.id IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_coach_assignments_coach_user_id ON coach_assignments(coach_user_id);
CREATE INDEX IF NOT EXISTS idx_body_checkins_user_id ON body_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_body_checkins_recorded_at ON body_checkins(recorded_at);
CREATE INDEX IF NOT EXISTS idx_workout_weeks_plan_id ON workout_weeks(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_week_id ON workout_days(week_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_groups_day_id ON workout_exercise_groups(day_id);
CREATE INDEX IF NOT EXISTS idx_workout_group_items_group_id ON workout_exercise_group_items(group_id);
