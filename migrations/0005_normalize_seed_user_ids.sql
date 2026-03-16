PRAGMA defer_foreign_keys = ON;

UPDATE users
SET id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE id = 'admin-seed';

UPDATE users
SET coach_user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE coach_user_id = 'admin-seed';

UPDATE users
SET invited_by_user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE invited_by_user_id = 'admin-seed';

UPDATE user_identities
SET id = '8e6b46a9-34cc-4c77-9b26-5c3c6d5be98d',
    user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE user_id = 'admin-seed';

UPDATE email_credentials
SET user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE user_id = 'admin-seed';

UPDATE sessions
SET user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE user_id = 'admin-seed';

UPDATE body_checkins
SET user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE user_id = 'admin-seed';

UPDATE body_checkins
SET created_by_user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE created_by_user_id = 'admin-seed';

UPDATE workout_plans
SET user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE user_id = 'admin-seed';

UPDATE workout_plans
SET created_by_user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE created_by_user_id = 'admin-seed';

UPDATE workout_plans
SET updated_by_user_id = '6f2c0f4a-6ff8-4b0b-8d32-b9f09e2c2f2d'
WHERE updated_by_user_id = 'admin-seed';

UPDATE users
SET id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE id = 'mattia-seed';

UPDATE users
SET coach_user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE coach_user_id = 'mattia-seed';

UPDATE users
SET invited_by_user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE invited_by_user_id = 'mattia-seed';

UPDATE user_identities
SET user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE user_id = 'mattia-seed';

UPDATE email_credentials
SET user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE user_id = 'mattia-seed';

UPDATE sessions
SET user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE user_id = 'mattia-seed';

UPDATE body_checkins
SET user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE user_id = 'mattia-seed';

UPDATE body_checkins
SET created_by_user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE created_by_user_id = 'mattia-seed';

UPDATE workout_plans
SET user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE user_id = 'mattia-seed';

UPDATE workout_plans
SET created_by_user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE created_by_user_id = 'mattia-seed';

UPDATE workout_plans
SET updated_by_user_id = '4b1c8a31-5f72-46d7-b9d8-7f5e0f4f3cf1'
WHERE updated_by_user_id = 'mattia-seed';
