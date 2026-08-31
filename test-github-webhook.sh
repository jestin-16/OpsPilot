#!/bin/bash

echo "Sending simulated GitHub Push Event to OpsPilot..."

curl -X POST http://localhost:8080/api/v1/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "name": "notes-app"
    },
    "head_commit": {
      "id": "7a3b4c9d",
      "message": "feat: Implemented Supabase login UI",
      "author": {
        "name": "Jestin"
      }
    }
  }'

echo -e "\n\nDone! If OpsPilot is running, the commit log was just saved to the database!"
