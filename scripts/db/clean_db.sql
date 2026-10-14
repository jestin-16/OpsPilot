DO $$ 
DECLARE
    p_id bigint;
BEGIN
    FOR p_id IN SELECT id FROM projects WHERE project_name IN ('Payment Service', 'Notes Application', 'Event Platform') LOOP
        DELETE FROM notifications WHERE deployment_id IN (SELECT id FROM deployments WHERE project_id = p_id);
        DELETE FROM deployments WHERE project_id = p_id;
        DELETE FROM incidents WHERE project_id = p_id;
        DELETE FROM pipeline_runs WHERE project_id = p_id;
        DELETE FROM commit_logs WHERE project_id = p_id;
        DELETE FROM log_sources WHERE project_id = p_id;
        DELETE FROM logs WHERE project_id = p_id;
        DELETE FROM projects WHERE id = p_id;
    END LOOP;
    
    -- Now delete the seeded users and any remaining references
    DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com'));
    DELETE FROM incidents WHERE created_by_id IN (SELECT id FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com'));
    DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com'));
    DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com'));
    DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com'));
    DELETE FROM email_verification_otps WHERE user_id IN (SELECT id FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com'));
    DELETE FROM users WHERE email IN ('devops@opspilot.io', 'admin@opspilot.io', 'developer@opspilot.io', 'opspilot-audit-other@example.com');
END $$;
