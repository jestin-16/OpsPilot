-- Insert mock Vercel NDJSON logs directly to the DB for the demo

INSERT INTO logs (log_level, message, source_service, timestamp, project_id, deployment_id)
VALUES 
('INFO', 'Vercel-Edge: GET /api/users 200 OK', 'Vercel Integration', NOW() - INTERVAL '2 minutes', 24, NULL),
('ERROR', 'Vercel-Lambda: Uncaught Exception in handler at auth.js:42', 'Vercel Integration', NOW() - INTERVAL '5 minutes', 24, NULL),
('WARN', 'Vercel-Lambda: DB connection closed unexpectedly, retrying...', 'Vercel Integration', NOW() - INTERVAL '10 minutes', 24, NULL),
('INFO', 'Vercel-Edge: POST /api/payments 201 Created', 'Vercel Integration', NOW() - INTERVAL '12 minutes', 24, NULL),
('INFO', 'Vercel-Edge: GET / 200 OK', 'Vercel Integration', NOW() - INTERVAL '15 minutes', 24, NULL);

DELETE FROM logs WHERE message = 'No message';
