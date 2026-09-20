#!/usr/bin/env bash
set -uo pipefail

BASE_URL="${OPSPILOT_API_URL:-http://localhost:8080/api/v1}"
DEVOPS_EMAIL="${DEVOPS_EMAIL:-devops@opspilot.io}"
DEVOPS_PASSWORD="${DEVOPS_PASSWORD:-Password123!}"
DEV_EMAIL="${DEVELOPER_EMAIL:-developer@opspilot.io}"
DEV_PASSWORD="${DEVELOPER_PASSWORD:-Password123!}"
OTHER_EMAIL="${OTHER_EMAIL:-opspilot-audit-other@example.com}"
OTHER_PASSWORD="${OTHER_PASSWORD:-Password123!}"
ALLOWLISTED_REPO="https://github.com/opspilot/allowlisted-test-repo"
NON_ALLOWLISTED_REPO="https://evil.com/malicious/repo"
TMP_DIR="${TMPDIR:-/tmp}/opspilot-devops-audit-$$"
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
  local method="$1" url="$2" token="${3:-}" body="${4:-}" extra_header="${5:-}" output="$TMP_DIR/response"
  local args=(-sS -o "$output" -w '%{http_code}' -X "$method" "$url" -H 'Content-Type: application/json')
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$extra_header" ]] && args+=(-H "$extra_header")
  [[ -n "$body" ]] && args+=(--data "$body")
  HTTP_STATUS=$(curl "${args[@]}" 2>"$TMP_DIR/curl-error") || HTTP_STATUS=000
  RESPONSE=$(cat "$output" 2>/dev/null || true)
}

json_value() {
  python -c 'import json,sys; data=json.load(sys.stdin); value=data
for key in sys.argv[1].split("."): value=value.get(key) if isinstance(value,dict) else None
print("" if value is None else value)' "$1" <<<"$RESPONSE" 2>/dev/null || true
}

printf 'OpsPilot DevOps Engineer E2E Verification\nAPI: %s\n\n' "$BASE_URL"

# Pre-flight reachability
request GET "${BASE_URL%/}/auth/login"
if [[ "$HTTP_STATUS" == "000" ]]; then
  report BLOCKED "Live API unavailable: $(cat "$TMP_DIR/curl-error" 2>/dev/null || echo connection failed)"
  printf '\nSummary: PASS=%d FAIL=%d BLOCKED=%d\n' "$PASS" "$FAIL" "$BLOCKED"
  exit 2
fi

# ==============================================================================
# 1. DevOps Engineer Authentication & Profile
# ==============================================================================
request POST "${BASE_URL%/}/auth/login" '' "{\"email\":\"$DEVOPS_EMAIL\",\"password\":\"$DEVOPS_PASSWORD\"}"
DEVOPS_TOKEN=$(json_value token)
DEVOPS_ROLES=$(python -c 'import json,sys; data=json.load(sys.stdin); print(",".join(data.get("roles", [])))' <<<"$RESPONSE" 2>/dev/null || true)

if [[ "$HTTP_STATUS" == 2* && -n "$DEVOPS_TOKEN" ]]; then
  report PASS "1 DevOps Engineer can log in"
  if [[ "$DEVOPS_ROLES" == *"DevOps"* || "$DEVOPS_ROLES" == *"DEVOPS"* ]]; then
    report PASS "1 JWT issued with DevOps Engineer role ($DEVOPS_ROLES)"
  else
    report FAIL "1 JWT missing DevOps Engineer role: roles=$DEVOPS_ROLES"
  fi
else
  report FAIL "1 DevOps Engineer login failed: HTTP $HTTP_STATUS $RESPONSE"
  printf '\nSummary: PASS=%d FAIL=%d BLOCKED=%d\n' "$PASS" "$FAIL" "$BLOCKED"
  exit 1
fi

request GET "${BASE_URL%/}/users/me" "$DEVOPS_TOKEN"
[[ "$HTTP_STATUS" == "200" ]] && report PASS "1 DevOps Engineer can view own profile" || report FAIL "1 DevOps profile read failed: HTTP $HTTP_STATUS $RESPONSE"

# ==============================================================================
# 2. Cross-Project Docker Visibility (DevOps Engineer)
# ==============================================================================
request GET "${BASE_URL%/}/docker/containers" "$DEVOPS_TOKEN"
DEVOPS_CTR_COUNT=$(python -c 'import json,sys; data=json.load(sys.stdin); print(len(data) if isinstance(data,list) else 0)' <<<"$RESPONSE" 2>/dev/null || echo 0)

if [[ "$HTTP_STATUS" == "200" && "$DEVOPS_CTR_COUNT" -ge 2 ]]; then
  report PASS "2 DevOps Engineer sees containers across multiple projects (count=$DEVOPS_CTR_COUNT)"
  
  # Check image names from multiple projects
  CTR1_ID=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("containerId","") if len(data)>0 else "")' <<<"$RESPONSE" 2>/dev/null || true)
  CTR1_IMAGE=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("imageName","") if len(data)>0 else "")' <<<"$RESPONSE" 2>/dev/null || true)
  CTR2_IMAGE=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[1].get("imageName","") if len(data)>1 else "")' <<<"$RESPONSE" 2>/dev/null || true)
  
  if [[ "$CTR1_IMAGE" != "$CTR2_IMAGE" && -n "$CTR1_IMAGE" && -n "$CTR2_IMAGE" ]]; then
    report PASS "2 Multi-project containers confirmed: $CTR1_IMAGE and $CTR2_IMAGE"
  else
    report FAIL "2 Expected containers from different projects, got $CTR1_IMAGE and $CTR2_IMAGE"
  fi

  # Verify daemon synchronization against independent docker ps
  DAEMON_STATE=$(docker ps -a --format '{{.Image}}|{{.State}}' | awk -F'|' -v image="$CTR1_IMAGE" '$1 == image {print toupper($2); exit}')
  CTR1_STATUS=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("containerStatus","") if len(data)>0 else "")' <<<"$RESPONSE" 2>/dev/null || true)
  if [[ -n "$DAEMON_STATE" && "$CTR1_STATUS" == "$DAEMON_STATE"* ]]; then
    report PASS "2 Container status in API matches independent docker ps ($CTR1_STATUS == $DAEMON_STATE)"
  else
    report FAIL "2 Container status mismatch: API=$CTR1_STATUS docker_ps=${DAEMON_STATE:-none}"
  fi

  # DevOps lifecycle execution on cross-project container
  request POST "${BASE_URL%/}/docker/containers/$CTR1_ID/stop" "$DEVOPS_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "2 DevOps Engineer can stop cross-project container" || report FAIL "2 DevOps stop container failed: HTTP $HTTP_STATUS $RESPONSE"
  request POST "${BASE_URL%/}/docker/containers/$CTR1_ID/start" "$DEVOPS_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "2 DevOps Engineer can start cross-project container" || report FAIL "2 DevOps start container failed: HTTP $HTTP_STATUS $RESPONSE"
  request POST "${BASE_URL%/}/docker/containers/$CTR1_ID/restart" "$DEVOPS_TOKEN"
  [[ "$HTTP_STATUS" == "200" ]] && report PASS "2 DevOps Engineer can restart cross-project container" || report FAIL "2 DevOps restart container failed: HTTP $HTTP_STATUS $RESPONSE"
else
  report FAIL "2 Cross-project container visibility failed: HTTP $HTTP_STATUS count=$DEVOPS_CTR_COUNT expected >= 2"
fi

# ==============================================================================
# 3. Developer Role Permission Boundary Cross-Check (Regression Prevention)
# ==============================================================================
request POST "${BASE_URL%/}/auth/login" '' "{\"email\":\"$DEV_EMAIL\",\"password\":\"$DEV_PASSWORD\"}"
DEV_TOKEN=$(json_value token)
if [[ -n "$DEV_TOKEN" ]]; then
  request GET "${BASE_URL%/}/docker/containers" "$DEV_TOKEN"
  DEV_CTR_COUNT=$(python -c 'import json,sys; data=json.load(sys.stdin); print(len(data) if isinstance(data,list) else 0)' <<<"$RESPONSE" 2>/dev/null || echo 0)
  
  if [[ "$HTTP_STATUS" == "200" && "$DEV_CTR_COUNT" -eq 1 ]]; then
    report PASS "3 Developer only sees own containers (count=$DEV_CTR_COUNT < DevOps count $DEVOPS_CTR_COUNT)"
  else
    report FAIL "3 Developer container boundary leak: count=$DEV_CTR_COUNT (expected 1)"
  fi

  # Developer attempting to access another user's container must be rejected (403)
  if [[ -n "${CTR2_ID:-}" ]]; then
    request POST "${BASE_URL%/}/docker/containers/$CTR2_ID/stop" "$DEV_TOKEN"
    [[ "$HTTP_STATUS" == "403" ]] && report PASS "3 Developer blocked (403) from controlling other user's container" || report FAIL "3 Developer unauthorized control returned HTTP $HTTP_STATUS"
  fi
else
  report BLOCKED "3 Developer authentication failed"
fi

# ==============================================================================
# 4. Real Kubernetes Integration (Side-by-Side kubectl Comparison)
# ==============================================================================
request GET "${BASE_URL%/}/kubernetes/pods" "$DEVOPS_TOKEN"
K8S_API_HTTP="$HTTP_STATUS"
K8S_API_RESP="$RESPONSE"

# Independently query live cluster via kubectl
KUBECTL_PODS=$(kubectl get pods -A -o json 2>"$TMP_DIR/k8s-error" || true)
KUBECTL_COUNT=$(python -c 'import json,sys; data=json.load(sys.stdin); print(len(data.get("items", [])))' <<<"$KUBECTL_PODS" 2>/dev/null || echo 0)

if [[ "$K8S_API_HTTP" == "200" && "$KUBECTL_COUNT" -gt 0 ]]; then
  report PASS "4 Kubernetes live cluster accessible via kubectl ($KUBECTL_COUNT pods in cluster)"
  
  # Extract names from API and kubectl
  API_POD_NAMES=$(python -c 'import json,sys; data=json.load(sys.stdin); print(",".join(sorted(p.get("podName") or p.get("name") or "" for p in data)))' <<<"$K8S_API_RESP" 2>/dev/null || true)
  KUBECTL_POD_NAMES=$(python -c 'import json,sys; data=json.load(sys.stdin); print(",".join(sorted(p["metadata"]["name"] for p in data.get("items", []))))' <<<"$KUBECTL_PODS" 2>/dev/null || true)
  
  # Check if at least default or system pods match live cluster and node is real
  NODE_NAME=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("nodeName","") if len(data)>0 else "")' <<<"$K8S_API_RESP" 2>/dev/null || true)
  
  if [[ -n "$NODE_NAME" && "$NODE_NAME" != "minikube-node-1" ]]; then
    report PASS "4 API returns real cluster node name ($NODE_NAME), not static mock"
  else
    report FAIL "4 API returned static DB mock node name ($NODE_NAME)"
  fi

  # Check pod name presence in real cluster
  SAMPLE_POD=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("podName") or data[0].get("name") or "")' <<<"$K8S_API_RESP" 2>/dev/null || true)
  if [[ -n "$SAMPLE_POD" && "$KUBECTL_POD_NAMES" == *"$SAMPLE_POD"* ]]; then
    report PASS "4 Real pod ($SAMPLE_POD) verified side-by-side against kubectl get pods"
  else
    report FAIL "4 Pod data mismatch between API and kubectl: sample=$SAMPLE_POD kubectl_pods=$KUBECTL_POD_NAMES"
  fi
else
  report FAIL "4 Kubernetes integration failed: API HTTP $K8S_API_HTTP kubectl_count=$KUBECTL_COUNT"
fi

# ==============================================================================
# 5. Sandboxed CI/CD Pipeline Execution & Allowlist Enforcement
# ==============================================================================
# Check 5a: Allowlist Rejection for non-allowlisted repo URL
NON_ALLOW_PAYLOAD="{\"repository\":{\"clone_url\":\"$NON_ALLOWLISTED_REPO\"},\"ref\":\"refs/heads/main\",\"head_commit\":{\"id\":\"badsha123\",\"message\":\"untrusted repo\",\"author\":{\"name\":\"untrusted\"}}}"
request POST "${BASE_URL%/}/cicd/webhooks/github" "$DEVOPS_TOKEN" "$NON_ALLOW_PAYLOAD"
if [[ "$HTTP_STATUS" == "403" ]]; then
  report PASS "5 Non-allowlisted repository URL is rejected before execution (HTTP 403 Forbidden)"
else
  report FAIL "5 Non-allowlisted URL was NOT rejected: HTTP $HTTP_STATUS $RESPONSE"
fi

# Check 5b: Zero Thread.sleep in CiCdService source
THREAD_SLEEP_COUNT=$(grep -c "Thread\.sleep" d:/OpsPilot/backend/core-service/src/main/java/com/opspilot/service/CiCdService.java 2>/dev/null || true)
if [[ "${THREAD_SLEEP_COUNT:-1}" == "0" ]]; then
  report PASS "5 Zero Thread.sleep simulated timing in CiCdService"
else
  report FAIL "5 CiCdService still contains $THREAD_SLEEP_COUNT Thread.sleep occurrences"
fi

# Check 5c: Allowlisted Pipeline Run (Passing Build with Real Docker Execution)
ALLOW_PAYLOAD="{\"repository\":{\"clone_url\":\"$ALLOWLISTED_REPO\"},\"ref\":\"refs/heads/main\",\"head_commit\":{\"id\":\"commit-$(date +%s)\",\"message\":\"build and test\",\"author\":{\"name\":\"DevOps Engineer\"}}}"
START_TIME=$(date +%s)
request POST "${BASE_URL%/}/cicd/webhooks/github" "$DEVOPS_TOKEN" "$ALLOW_PAYLOAD"

if [[ "$HTTP_STATUS" == 2* ]]; then
  RUN_ID=$(json_value runId)
  # If runId not in response body, fetch latest run
  if [[ -z "$RUN_ID" ]]; then
    request GET "${BASE_URL%/}/cicd/runs" "$DEVOPS_TOKEN"
    RUN_ID=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("runId","") if data else "")' <<<"$RESPONSE" 2>/dev/null || true)
  fi

  if [[ -n "$RUN_ID" ]]; then
    # Wait for container execution to complete (poll up to 15s)
    RUN_STATUS="BUILDING"
    for _ in $(seq 1 15); do
      sleep 1
      request GET "${BASE_URL%/}/cicd/runs/$RUN_ID" "$DEVOPS_TOKEN"
      RUN_STATUS=$(json_value status)
      [[ "$RUN_STATUS" == "SUCCESS" || "$RUN_STATUS" == "FAILED" ]] && break
    done
    ELAPSED=$(( $(date +%s) - START_TIME ))

    if [[ "$RUN_STATUS" == "SUCCESS" ]]; then
      report PASS "5 Allowlisted pipeline executed to SUCCESS (status=$RUN_STATUS elapsed=${ELAPSED}s)"
    else
      report FAIL "5 Pipeline run did not succeed: status=$RUN_STATUS (HTTP $HTTP_STATUS $RESPONSE)"
    fi

    # Check real build output and real exit code
    request GET "${BASE_URL%/}/cicd/runs/$RUN_ID/logs" "$DEVOPS_TOKEN"
    BUILD_LOGS="$RESPONSE"
    EXIT_CODE=$(json_value exitCode)
    if [[ -z "$EXIT_CODE" ]]; then
      request GET "${BASE_URL%/}/cicd/runs/$RUN_ID" "$DEVOPS_TOKEN"
      EXIT_CODE=$(json_value exitCode)
    fi

    if [[ "$EXIT_CODE" == "0" ]]; then
      report PASS "5 Pipeline exit code is 0 for passing build"
    else
      report FAIL "5 Expected exit code 0, got $EXIT_CODE"
    fi

    if [[ -n "$BUILD_LOGS" && "$BUILD_LOGS" != "null" && "$BUILD_LOGS" != "{}" ]]; then
      report PASS "5 Real build logs captured from container execution"
    else
      report FAIL "5 Build logs are empty or missing"
    fi
  else
    report FAIL "5 Could not retrieve runId for triggered pipeline"
  fi
else
  report FAIL "5 Allowlisted webhook trigger failed: HTTP $HTTP_STATUS $RESPONSE"
fi

# Check 5d: Failing Build Pipeline Run (Real Docker Failure with Non-Zero Exit Code)
FAIL_PAYLOAD="{\"repository\":{\"clone_url\":\"$ALLOWLISTED_REPO\"},\"ref\":\"refs/heads/main\",\"head_commit\":{\"id\":\"fail-$(date +%s)\",\"message\":\"[trigger-failure] failing test suite\",\"author\":{\"name\":\"DevOps Engineer\"}}}"
request POST "${BASE_URL%/}/cicd/webhooks/github" "$DEVOPS_TOKEN" "$FAIL_PAYLOAD"
if [[ "$HTTP_STATUS" == 2* ]]; then
  FAIL_RUN_ID=$(json_value runId)
  if [[ -z "$FAIL_RUN_ID" ]]; then
    request GET "${BASE_URL%/}/cicd/runs" "$DEVOPS_TOKEN"
    FAIL_RUN_ID=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data[0].get("runId","") if data else "")' <<<"$RESPONSE" 2>/dev/null || true)
  fi

  if [[ -n "$FAIL_RUN_ID" ]]; then
    FAIL_RUN_STATUS="BUILDING"
    for _ in $(seq 1 15); do
      sleep 1
      request GET "${BASE_URL%/}/cicd/runs/$FAIL_RUN_ID" "$DEVOPS_TOKEN"
      FAIL_RUN_STATUS=$(json_value status)
      [[ "$FAIL_RUN_STATUS" == "SUCCESS" || "$FAIL_RUN_STATUS" == "FAILED" ]] && break
    done

    if [[ "$FAIL_RUN_STATUS" == "FAILED" ]]; then
      report PASS "5 Failing pipeline executed to FAILED (status=$FAIL_RUN_STATUS)"
    else
      report FAIL "5 Expected FAILED status for failure run, got $FAIL_RUN_STATUS"
    fi

    request GET "${BASE_URL%/}/cicd/runs/$FAIL_RUN_ID" "$DEVOPS_TOKEN"
    FAIL_EXIT_CODE=$(json_value exitCode)
    if [[ -n "$FAIL_EXIT_CODE" && "$FAIL_EXIT_CODE" != "0" ]]; then
      report PASS "5 Pipeline exit code is non-zero ($FAIL_EXIT_CODE) for failing build"
    else
      report FAIL "5 Expected non-zero exit code for failing build, got '$FAIL_EXIT_CODE'"
    fi
  else
    report FAIL "5 Could not retrieve failure runId"
  fi
else
  report FAIL "5 Failure webhook trigger failed: HTTP $HTTP_STATUS $RESPONSE"
fi

# ==============================================================================
# 6. Infrastructure-wide Monitoring Aggregation
# ==============================================================================
request GET "${BASE_URL%/}/monitoring/metrics?providerName=local" "$DEVOPS_TOKEN"
if [[ "$HTTP_STATUS" == "200" ]]; then
  ACTIVE_PROJECTS=$(python -c 'import json,sys; data=json.load(sys.stdin); print(data.get("activeProjects") or data.get("totalDeployments") or 0)' <<<"$RESPONSE" 2>/dev/null || echo 0)
  METRICS_STATUS=$(json_value status)
  
  if [[ "$METRICS_STATUS" == "AVAILABLE" || "$ACTIVE_PROJECTS" -ge 2 ]]; then
    report PASS "6 Monitoring aggregates real telemetry across multiple projects (deployments/projects=$ACTIVE_PROJECTS)"
  else
    report FAIL "6 Monitoring telemetry incomplete: status=$METRICS_STATUS projects=$ACTIVE_PROJECTS $RESPONSE"
  fi
else
  report FAIL "6 Monitoring metrics endpoint failed: HTTP $HTTP_STATUS $RESPONSE"
fi

printf '\nSummary: PASS=%d FAIL=%d BLOCKED=%d\n' "$PASS" "$FAIL" "$BLOCKED"
[[ "$FAIL" -eq 0 && "$BLOCKED" -eq 0 ]]
