BEGIN;

-- 1. Insert Kerala friends as users with password 'KeralaDev#2026!'
INSERT INTO users (name, email, password_hash, email_verified, is_active, created_at) VALUES
('Alan Varghese', 'alan.varghese@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '30 days'),
('Anjali Menon', 'anjali.menon@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '28 days'),
('Bibin Mathew', 'bibin.mathew@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '25 days'),
('Sneha Suresh', 'sneha.suresh@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '24 days'),
('Rahul Nair', 'rahul.nair@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '20 days'),
('Akhil Thomas', 'akhil.thomas@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '18 days'),
('Rony George', 'rony.george@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '15 days'),
('Joel Joseph', 'joel.joseph@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '12 days'),
('Devika Pillai', 'devika.pillai@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '10 days'),
('Ashwin K', 'ashwin.k@opspilot.io', crypt('KeralaDev#2026!', gen_salt('bf', 12)), true, true, NOW() - INTERVAL '8 days')
ON CONFLICT (email) DO UPDATE SET 
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    is_active = true,
    email_verified = true;

-- 2. Assign Roles (DEVOPS & DEVELOPER)
-- Alan Varghese: DEVOPS
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'alan.varghese@opspilot.io' AND r.role_name = 'DEVOPS'
ON CONFLICT DO NOTHING;

-- Anjali Menon: DEVELOPER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'anjali.menon@opspilot.io' AND r.role_name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- Bibin Mathew: DEVOPS
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'bibin.mathew@opspilot.io' AND r.role_name = 'DEVOPS'
ON CONFLICT DO NOTHING;

-- Sneha Suresh: DEVELOPER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'sneha.suresh@opspilot.io' AND r.role_name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- Rahul Nair: DEVOPS
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'rahul.nair@opspilot.io' AND r.role_name = 'DEVOPS'
ON CONFLICT DO NOTHING;

-- Akhil Thomas: DEVELOPER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'akhil.thomas@opspilot.io' AND r.role_name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- Rony George: DEVELOPER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'rony.george@opspilot.io' AND r.role_name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- Joel Joseph: DEVELOPER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'joel.joseph@opspilot.io' AND r.role_name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- Devika Pillai: DEVOPS
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'devika.pillai@opspilot.io' AND r.role_name = 'DEVOPS'
ON CONFLICT DO NOTHING;

-- Ashwin K: DEVELOPER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'ashwin.k@opspilot.io' AND r.role_name = 'DEVELOPER'
ON CONFLICT DO NOTHING;

-- 3. Add commits from Kerala friends to projects
INSERT INTO commit_logs (author, branch_name, commit_sha, message, timestamp, project_id) VALUES
('Alan Varghese', 'main', 'd4e5f60718293a4b5c6d7e8f9a0b1c2d3e4a5b6c', 'feat(k8s): optimize resource requests and probes for attendance-api pods', NOW() - INTERVAL '1 hour 30 minutes', 4),
('Anjali Menon', 'main', 'e5f60718293a4b5c6d7e8f9a0b1c2d3e4a5b6c7d', 'fix(sync): resolve note version conflict handling during concurrent edits', NOW() - INTERVAL '3 hours 15 minutes', 3),
('Bibin Mathew', 'main', 'f60718293a4b5c6d7e8f9a0b1c2d3e4a5b6c7d8e', 'perf(redis): tune maxmemory eviction policy to allkeys-lru on notes cluster', NOW() - INTERVAL '6 hours', 3),
('Sneha Suresh', 'main', '0718293a4b5c6d7e8f9a0b1c2d3e4a5b6c7d8e9f', 'feat(cart): implement instant coupon validation in checkout pipeline', NOW() - INTERVAL '12 hours', 7),
('Rahul Nair', 'main', '18293a4b5c6d7e8f9a0b1c2d3e4a5b6c7d8e9f01', 'fix(pos): kitchen terminal auto-reconnect logic on wifi disconnection', NOW() - INTERVAL '18 hours', 6),
('Joel Joseph', 'main', '293a4b5c6d7e8f9a0b1c2d3e4a5b6c7d8e9f0112', 'style(theme): add glassmorphic tokens and responsive card padding', NOW() - INTERVAL '1 day', 3)
ON CONFLICT DO NOTHING;

-- 4. Add deployments attributed to Kerala team members
INSERT INTO deployments (deployed_at, environment, status, version, deployed_by_id, project_id, source, url, actor, updated_at) VALUES
(
    NOW() - INTERVAL '1 hour 15 minutes', 
    'production', 
    'Succeeded', 
    'v1.4.3', 
    (SELECT id FROM users WHERE email = 'alan.varghese@opspilot.io'), 
    4, 
    'GITHUB_ACTIONS', 
    'https://attendance-backend-c0495.containers.snapdeploy.app', 
    'alan.varghese@opspilot.io', 
    NOW() - INTERVAL '1 hour 15 minutes'
),
(
    NOW() - INTERVAL '2 hours 50 minutes', 
    'production', 
    'Succeeded', 
    'v2.4.2', 
    (SELECT id FROM users WHERE email = 'anjali.menon@opspilot.io'), 
    3, 
    'GITHUB_ACTIONS', 
    'https://notesapp.jestin16.dev', 
    'anjali.menon@opspilot.io', 
    NOW() - INTERVAL '2 hours 50 minutes'
),
(
    NOW() - INTERVAL '5 hours', 
    'production', 
    'Succeeded', 
    'v3.1.3', 
    (SELECT id FROM users WHERE email = 'sneha.suresh@opspilot.io'), 
    7, 
    'GITHUB_ACTIONS', 
    'https://shop.jestin16.dev', 
    'sneha.suresh@opspilot.io', 
    NOW() - INTERVAL '5 hours'
);

-- 5. Add notifications for Jestin regarding teammate activities
INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES
(5, 'DEPLOYMENT_SUCCESS', 'Alan Varghese deployed v1.4.3 of attendance-backend to Production.', false, NOW() - INTERVAL '1 hour 15 minutes'),
(5, 'DEPLOYMENT_SUCCESS', 'Anjali Menon deployed v2.4.2 of notesapp to Production.', false, NOW() - INTERVAL '2 hours 50 minutes'),
(5, 'TEAM_ACTIVITY', 'Bibin Mathew updated cluster cache limits on notesapp-redis.', false, NOW() - INTERVAL '6 hours');

COMMIT;
