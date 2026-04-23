-- Default platform admin for first login (change password after setup).
-- Password plain text: admin123  (BCrypt strength 10, matches BCryptPasswordEncoder)
INSERT INTO users (email, password_hash, full_name, role, status)
SELECT
    'admin@lms.local',
    '$2a$10$8BgEqebxjPQ2J1hkmtRjwOzJZWuxlLVScJKYWijyo3ZvsjxnrX7Pq',
    'System Administrator',
    'ADMIN'::user_role,
    'ACTIVE'::user_status
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@lms.local');
