-- Registrations previously waiting for an email code can now sign in.
-- Verified accounts deactivated by an administrator stay deactivated.
UPDATE users
SET email_verified = TRUE, is_active = TRUE
WHERE email_verified = FALSE;
