ALTER TABLE users ADD COLUMN preferred_workout_plan_id TEXT;
ALTER TABLE users ADD COLUMN last_seen_workout_publication_at TEXT;

ALTER TABLE workout_plans ADD COLUMN published_at TEXT;
ALTER TABLE workout_plans ADD COLUMN published_snapshot_json TEXT;

CREATE INDEX IF NOT EXISTS idx_users_preferred_workout_plan_id
  ON users(preferred_workout_plan_id);

CREATE INDEX IF NOT EXISTS idx_workout_plans_published_at
  ON workout_plans(published_at);

UPDATE workout_plans
SET published_at = COALESCE(updated_at, created_at)
WHERE published_at IS NULL;

UPDATE users
SET preferred_workout_plan_id = COALESCE(
  (
    SELECT wp.id
    FROM workout_plans wp
    WHERE wp.user_id = users.id
      AND wp.is_active = 1
    ORDER BY datetime(wp.updated_at) DESC, datetime(wp.created_at) DESC
    LIMIT 1
  ),
  (
    SELECT wp.id
    FROM workout_plans wp
    WHERE wp.user_id = users.id
      AND wp.published_at IS NOT NULL
    ORDER BY datetime(wp.published_at) DESC, datetime(wp.updated_at) DESC, datetime(wp.created_at) DESC
    LIMIT 1
  )
)
WHERE preferred_workout_plan_id IS NULL;

UPDATE users
SET last_seen_workout_publication_at = (
  SELECT MAX(wp.published_at)
  FROM workout_plans wp
  WHERE wp.user_id = users.id
    AND wp.published_at IS NOT NULL
)
WHERE last_seen_workout_publication_at IS NULL;
