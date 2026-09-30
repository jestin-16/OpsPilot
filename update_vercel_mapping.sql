UPDATE log_sources SET field_mapping = '{"messageField": "message", "levelField": "level", "timestampField": "timestamp"}' WHERE public_id = 'vercel-demo-123';
DELETE FROM logs WHERE message = 'No message';
