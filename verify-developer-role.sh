#!/usr/bin/env bash
set -uo pipefail

BASE_URL="${OPSPILOT_API_URL:-http://localhost:8080/api/v1}"
DEV_EMAIL="${DEVELOPER_EMAIL:-developer@opspilot.io}"
DEV_PASSWORD="${DEVELOPER_PASSWORD:-Password123!}"
OTHER_EMAIL="${OTHER_EMAIL:-opspilot-audit-other@example.com}"
OTHER_PASSWORD="${OTHER_PASSWORD:-Password123!}"
RUNNER_REPO="${RUNNER_REPO:-https://github.com/opspilot/allowlisted-test-repo}"
TMP_DIR="${TMPDIR:-/tmp}/opspilot-developer-audit-$$"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

PASS=0
FAIL=0
BLOCKED=0

report() {
  local status="$1"; shift
  printf '%-8s %s\n' "$status" "$*"
  case "$status" in PASS) PASS=$((PASS + 1));; FAIL) FAIL=$((FAIL + 1));; BLOCKED) BLOCKED=$((BLOCKED + 1));; esac
}

request() {
  local method="$1" url="$2" token="${3:-}" body="${4:-}" output="$TMP_DIR/response"
  local args=(-sS -o "$output" -w '%{http_code}' -X "$method" "$url" -H 'Content-Type: application/json')
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]] && args+=(--data "$body")
  HTTP_STATUS=$(curl "${args[@]}" 2>"$TMP_DIR/curl-error") || HTTP_STATUS=000
  RESPONSE=$(cat "$output" 2>/dev/null || true)
}

json_value() {
  python -c 'import json,sys; data=json.load(sys.stdin); value=data
for key in sys.argv[1].split("."): value=value.get(key) if isinstance(value,dict) else None
print("" if value is None else value)' "$1" <<<"$RESPONSE" 2>/dev/null || true
}

printf 'OpsPilot Developer E2E verification\nAPI: %s\n\n' "$BASE_URL"
request GET "${BASE_URL%/}/auth/login"
if [[ "$HTTP_STATUS" == "000" ]]; then
  report BLOCKED "Live API unavailable: $(cat "$TMP_DIR/curl-error" 2>/dev/null || echo connection failed)"
  for item in \
    '1 Register/login and own profile' \
    '2 Own project CRUD and GitHub URL' \
    '3 Own Docker lifecycle and docker ps status' \
    '4 Cross-user project/container access blocked' \
    '5 Log-source wizard and first webhook event' \
    '6 Own centralized logs and SSE' \
    '7 Cross-user logs blocked' \
    '8 Live ProjectRunner output stream'; do
    report BLOCKED "$item"
  done
  printf '\nSummary: PASS=%d FAIL=%d BLOCKED=%d\n' "$PASS" "$FAIL" "$BLOCKED"
  exit 2
fi

request POST "${BASE_URL%/}/auth/login" '' "{\"email\":\"$DEV_EMAIL\",\"password\":\"$DEV_PASSWORD\"}"
DEV_TOKEN=$(json_value token)
if [[ "$HTTP_STATUS" != 2* || -z "$DEV_TOKEN" ]]; then
  report FAIL "1 Developer login failed: HTTP $HTTP_STATUS $RESPONSE"
  printf '\nSummary: PASS=%d FAIL=%d BLOCKED=%d\n' "$PASS" "$FAIL" "$BLOCKED"
  exit 1
fi
report PASS "1 Developer can log in"

request GET "${BASE_URL%/}/users/me" "$DEV_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "1 Developer can view own profile" || report FAIL "1 Own profile read failed: HTTP $HTTP_STATUS $RESPONSE"
request PUT "${BASE_URL%/}/users/me" "$DEV_TOKEN" "{\"name\":\"OpsPilot Audit Developer\",\"email\":\"$DEV_EMAIL\"}"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "1 Developer can update own profile" || report FAIL "1 Own profile update failed: HTTP $HTTP_STATUS $RESPONSE"

PROJECT_BODY="{\"projectName\":\"developer-audit-$(date +%s)\",\"description\":\"automated developer audit\",\"repositoryUrl\":\"$RUNNER_REPO\"}"
request POST "${BASE_URL%/}/projects" "$DEV_TOKEN" "$PROJECT_BODY"
PROJECT_ID=$(json_value id)
if [[ "$HTTP_STATUS" == "201" && -n "$PROJECT_ID" ]]; then
  report PASS "2 Developer can create own project"
else
  report FAIL "2 Project create failed: HTTP $HTTP_STATUS $RESPONSE"
fi

if [[ -n "$PROJECT_ID" ]]; then
  request GET "${BASE_URL%/}/projects/$PROJECT_ID" "$DEV_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "2 Developer can view own project" || report FAIL "2 Own project read failed: HTTP $HTTP_STATUS $RESPONSE"
  request PUT "${BASE_URL%/}/projects/$PROJECT_ID" "$DEV_TOKEN" "{\"description\":\"updated by audit\",\"repositoryUrl\":\"$RUNNER_REPO\"}"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "2 Developer can update own project and link repository" || report FAIL "2 Own project update failed: HTTP $HTTP_STATUS $RESPONSE"
fi

request GET "${BASE_URL%/}/projects" "$DEV_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "2 Developer can list own projects" || report FAIL "2 Own project list failed: HTTP $HTTP_STATUS $RESPONSE"

request GET "${BASE_URL%/}/docker/containers" "$DEV_TOKEN"
CONTAINER_ID=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("containerId", "") if data else "")' <<<"$RESPONSE" 2>/dev/null || true)
CONTAINER_IMAGE=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("imageName", "") if data else "")' <<<"$RESPONSE" 2>/dev/null || true)
CONTAINER_STATUS=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("containerStatus", "") if data else "")' <<<"$RESPONSE" 2>/dev/null || true)
if [[ "$HTTP_STATUS" == "200" && -n "$CONTAINER_ID" ]]; then
  report PASS "3 Developer can list own Docker containers"
  DAEMON_STATUS=$(docker ps -a --format '{{.Image}}|{{.State}}' 2>"$TMP_DIR/docker-error" | awk -F'|' -v image="$CONTAINER_IMAGE" '$1 == image {print toupper($2); exit}')
  if [[ -n "$DAEMON_STATUS" && "$CONTAINER_STATUS" == "$DAEMON_STATUS"* ]]; then
    report PASS "3 API container status matches independent docker ps"
  else
    report FAIL "3 Container status mismatch: API=$CONTAINER_STATUS docker_ps=${DAEMON_STATUS:-unavailable} image=$CONTAINER_IMAGE"
  fi
  request POST "${BASE_URL%/}/docker/containers/$CONTAINER_ID/stop" "$DEV_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "3 Developer can stop own container" || report FAIL "3 Stop own container failed: HTTP $HTTP_STATUS $RESPONSE"
  request POST "${BASE_URL%/}/docker/containers/$CONTAINER_ID/start" "$DEV_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "3 Developer can start own container" || report FAIL "3 Start own container failed: HTTP $HTTP_STATUS $RESPONSE"
  request POST "${BASE_URL%/}/docker/containers/$CONTAINER_ID/restart" "$DEV_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "3 Developer can restart own container" || report FAIL "3 Restart own container failed: HTTP $HTTP_STATUS $RESPONSE"
else
  report BLOCKED "3 No own Docker container fixture was returned: HTTP $HTTP_STATUS $RESPONSE"
fi

request POST "${BASE_URL%/}/projects/${PROJECT_ID:-0}/run" "$DEV_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "8 ProjectRunner accepted clone/run" || report FAIL "8 ProjectRunner failed: HTTP $HTTP_STATUS $RESPONSE"

request GET "${BASE_URL%/}/projects/${PROJECT_ID:-0}/status" "$DEV_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "8 Developer can read live runner status" || report FAIL "8 Runner status failed: HTTP $HTTP_STATUS $RESPONSE"

request POST "${BASE_URL%/}/projects/${PROJECT_ID:-0}/stop" "$DEV_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "8 Developer can stop own runner" || report FAIL "8 Runner stop failed: HTTP $HTTP_STATUS $RESPONSE"

request POST "${BASE_URL%/}/projects/${PROJECT_ID:-0}/log-sources" "$DEV_TOKEN" '{"sourceName":"developer-audit","ingestionMode":"WEBHOOK","fieldMapping":"{}","isActive":true}'
SOURCE_ID=$(json_value sourceId)
PUBLIC_ID=$(json_value publicId)
WEBHOOK_SECRET=$(json_value secret)
if [[ "$HTTP_STATUS" == "200" && -n "$SOURCE_ID" && -n "$PUBLIC_ID" && -n "$WEBHOOK_SECRET" ]]; then
  report PASS "5 Log source wizard generated webhook URL and secret"
  request POST "${BASE_URL%/}/ingest/webhook/$PUBLIC_ID" '' '{"source":"developer-audit","level":"INFO","message":"first audit event"}'
  if [[ "$HTTP_STATUS" == "200" ]]; then
    report PASS "5 First webhook event accepted"
  else
    report FAIL "5 Webhook event failed: HTTP $HTTP_STATUS $RESPONSE"
  fi
else
  report FAIL "5 Log source creation failed: HTTP $HTTP_STATUS $RESPONSE"
fi

request GET "${BASE_URL%/}/logs?projectId=${PROJECT_ID:-0}" "$DEV_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "6 Developer can view own centralized logs" || report FAIL "6 Own logs failed: HTTP $HTTP_STATUS $RESPONSE"
if [[ -n "$PROJECT_ID" ]]; then
  SSE_CODE=$(timeout 8 curl -sS -N -o "$TMP_DIR/sse" -w '%{http_code}' -H "Authorization: Bearer $DEV_TOKEN" "${BASE_URL%/}/projects/$PROJECT_ID/stream" 2>"$TMP_DIR/sse-error" || true)
  [[ "$SSE_CODE" == "200" ]] && report PASS "6 Own project SSE stream is reachable" || report FAIL "6 Own SSE failed: HTTP ${SSE_CODE:-000} $(cat "$TMP_DIR/sse-error" 2>/dev/null || true)"
fi

request POST "${BASE_URL%/}/auth/login" '' "{\"email\":\"$OTHER_EMAIL\",\"password\":\"$OTHER_PASSWORD\"}"
OTHER_TOKEN=$(json_value token)
if [[ -n "$OTHER_TOKEN" && -n "$PROJECT_ID" ]]; then
  request GET "${BASE_URL%/}/projects/$PROJECT_ID" "$OTHER_TOKEN"
  [[ "$HTTP_STATUS" == "403" ]] && report PASS "4 Other user blocked from project (403)" || report FAIL "4 Other user project access returned HTTP $HTTP_STATUS"
  request GET "${BASE_URL%/}/projects/$PROJECT_ID/status" "$OTHER_TOKEN"
  [[ "$HTTP_STATUS" == "403" ]] && report PASS "4 Other user blocked from runner status (403)" || report FAIL "4 Other user runner status returned HTTP $HTTP_STATUS"
  request GET "${BASE_URL%/}/projects/$PROJECT_ID/output" "$OTHER_TOKEN"
  [[ "$HTTP_STATUS" == "403" ]] && report PASS "4 Other user blocked from project output (403)" || report FAIL "4 Other user output returned HTTP $HTTP_STATUS"
  if [[ -n "$CONTAINER_ID" ]]; then
    request POST "${BASE_URL%/}/docker/containers/$CONTAINER_ID/stop" "$OTHER_TOKEN"
    [[ "$HTTP_STATUS" == "403" ]] && report PASS "4 Other user blocked from container action (403)" || report FAIL "4 Other user container action returned HTTP $HTTP_STATUS"
  fi
  request GET "${BASE_URL%/}/logs?projectId=$PROJECT_ID" "$OTHER_TOKEN"
  [[ "$HTTP_STATUS" == "200" && "$RESPONSE" == "[]" ]] && report PASS "7 Other user sees no own-project logs" || report FAIL "7 Other user log access returned HTTP $HTTP_STATUS $RESPONSE"
else
  report BLOCKED "4/7 Could not create or authenticate second user for cross-user checks"
fi

if [[ -n "$PROJECT_ID" ]]; then
  request DELETE "${BASE_URL%/}/projects/$PROJECT_ID" "$DEV_TOKEN"
  [[ "$HTTP_STATUS" == "204" ]] && report PASS "2 Developer can delete own project" || report FAIL "2 Own project delete failed: HTTP $HTTP_STATUS $RESPONSE"
fi

printf '\nSummary: PASS=%d FAIL=%d BLOCKED=%d\n' "$PASS" "$FAIL" "$BLOCKED"
[[ "$FAIL" -eq 0 && "$BLOCKED" -eq 0 ]]
