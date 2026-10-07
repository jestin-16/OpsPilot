#!/bin/bash
set -e

echo "Registering user..."
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"testuser", "email":"test@example.com", "password":"Password123!", "role":"ADMIN"}' > /dev/null

echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"Password123!"}' | jq -r .token)

echo "TOKEN=$TOKEN"

echo "Test 3: POST /api/v1/cicd/sources (GitHub)"
CREATE_GH_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/cicd/sources \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My GitHub", "provider":"GITHUB_ACTIONS", "repoFullName":"opspilot/demo", "accessToken":"ghp_test"}')

echo "Create GH Response: $CREATE_GH_RESPONSE"
SOURCE_ID=$(echo $CREATE_GH_RESPONSE | jq -r .id)
WEBHOOK_SECRET=$(echo $CREATE_GH_RESPONSE | jq -r .webhookSecret)
WEBHOOK_URL=$(echo $CREATE_GH_RESPONSE | jq -r .webhookUrl)
echo "Source ID: $SOURCE_ID, Secret: $WEBHOOK_SECRET, URL: $WEBHOOK_URL"

echo "GET /api/v1/cicd/sources"
GET_LIST=$(curl -s -X GET http://localhost:8080/api/v1/cicd/sources -H "Authorization: Bearer $TOKEN")
echo "List: $GET_LIST"

echo "GET /api/v1/cicd/sources/$SOURCE_ID"
GET_ONE=$(curl -s -X GET http://localhost:8080/api/v1/cicd/sources/$SOURCE_ID -H "Authorization: Bearer $TOKEN")
echo "One: $GET_ONE"

echo "Test 4: Create Jenkins source with missing fields"
CREATE_JENKINS_MISSING=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/cicd/sources \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Jenkins", "provider":"JENKINS"}')
echo "Jenkins missing fields response code: $CREATE_JENKINS_MISSING"

echo "Test 5: Signed webhook (correct signature)"
PAYLOAD='{"action":"completed","workflow_run":{"conclusion":"failure","head_branch":"main","head_sha":"a1b2c3d","html_url":"http://github.com/logs","repository":{"full_name":"opspilot/demo"}}}'
# compute HMAC SHA256 of PAYLOAD using WEBHOOK_SECRET
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
echo "Signature: sha256=$SIG"

WEBHOOK_RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/v1/cicd/webhooks/github/$SOURCE_ID \
  -H "X-GitHub-Event: workflow_run" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "Webhook response: $WEBHOOK_RESP"

echo "Wrong signature"
WRONG_SIG="sha256=abcdef123456"
WEBHOOK_WRONG=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/v1/cicd/webhooks/github/$SOURCE_ID \
  -H "X-GitHub-Event: workflow_run" \
  -H "X-Hub-Signature-256: $WRONG_SIG" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "Webhook wrong sig response: $WEBHOOK_WRONG"

echo "Unknown source ID"
WEBHOOK_UNKNOWN=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/v1/cicd/webhooks/github/99999 \
  -H "X-GitHub-Event: workflow_run" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "Webhook unknown source response: $WEBHOOK_UNKNOWN"

echo "Event type push"
WEBHOOK_PUSH=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/v1/cicd/webhooks/github/$SOURCE_ID \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "Webhook push event response: $WEBHOOK_PUSH"

echo "Test 6: Check stored run"
RUNS=$(curl -s -X GET http://localhost:8080/api/v1/cicd/runs -H "Authorization: Bearer $TOKEN")
echo "Runs: $RUNS"

# Send duplicate payload
WEBHOOK_RESP_2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:8080/api/v1/cicd/webhooks/github/$SOURCE_ID \
  -H "X-GitHub-Event: workflow_run" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "Webhook response 2: $WEBHOOK_RESP_2"

echo "Check incidents"
INCIDENTS=$(curl -s -X GET http://localhost:8080/api/v1/incidents -H "Authorization: Bearer $TOKEN")
echo "Incidents: $INCIDENTS"
