ALTER TABLE workout_exercise_group_items
ADD COLUMN target_load TEXT;

ALTER TABLE workout_exercise_group_items
ADD COLUMN target_load_unit TEXT NOT NULL DEFAULT 'kg';
