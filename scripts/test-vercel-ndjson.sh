#!/bin/bash
# test-vercel-ndjson.sh

echo "Simulating Vercel NDJSON Log Drain..."

# Note: Replace this with an actual sourceId from the DB
SOURCE_ID=$1

if [ -z "$SOURCE_ID" ]; then
  echo "Usage: ./test-vercel-ndjson.sh <source-id>"
  exit 1
fi

PAYLOAD=$(cat <<EOF
{"message": "GET /api/users 200", "level": "INFO", "source": "Vercel-Edge", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
{"message": "Uncaught Exception in handler", "level": "ERROR", "source": "Vercel-Lambda", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
{"message": "DB connection closed", "level": "WARN", "source": "Vercel-Lambda", "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
EOF
)

curl -X POST http://localhost:8080/api/v1/ingest/webhook/$SOURCE_ID \
  -H "Content-Type: application/json" \
  -H "x-vercel-signature: your_vercel_secret_here" \
  -d "$PAYLOAD"

echo -e "\nPayload sent!"
