import urllib.request
import urllib.error
import json
import hmac
import hashlib

BASE_URL = "http://localhost:8080/api/v1"

def request(method, path, data=None, headers=None):
    if headers is None: headers = {}
    if data is not None:
        if isinstance(data, dict) or isinstance(data, list):
            data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

# print("Registering user...")
# status, body = request('POST', '/auth/register', {"name":"testuser", "email":"test2@example.com", "password":"Password123!", "role":"ADMIN"})
# print(f"Register: {status} {body}")

print("Logging in...")
status, body = request('POST', '/auth/login', {"email":"test2@example.com", "password":"Password123!"})
print(f"Login: {status} {body}")
token = json.loads(body).get('token')
auth_header = {"Authorization": f"Bearer {token}"}

print("Test 3: POST /cicd/sources (GitHub)")
status, body = request('POST', '/cicd/sources', {"name":"My GitHub", "provider":"GITHUB_ACTIONS", "repoFullName":"opspilot/demo", "accessToken":"ghp_test"}, auth_header)
print(f"Create GH: {status} {body}")
source_data = json.loads(body)
source_id = source_data.get('id')
webhook_secret = source_data.get('webhookSecret')

print("Test 3: GET /cicd/sources")
status, body = request('GET', '/cicd/sources', headers=auth_header)
print(f"List sources: {status} {body}")

print(f"Test 3: GET /cicd/sources/{source_id}")
status, body = request('GET', f'/cicd/sources/{source_id}', headers=auth_header)
print(f"Get one source: {status} {body}")

print("Test 4: Create Jenkins source with missing fields")
status, body = request('POST', '/cicd/sources', {"name":"My Jenkins", "provider":"JENKINS"}, auth_header)
print(f"Jenkins missing fields: {status} {body}")

print("Test 5: Signed webhook (correct signature)")
payload = '{"action":"completed","workflow_run":{"status":"completed","conclusion":"failure","head_branch":"main","head_sha":"a1b2c3d","html_url":"http://github.com/logs","repository":{"full_name":"opspilot/demo"}}}'
sig = hmac.new(webhook_secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()
headers = {"X-GitHub-Event": "workflow_run", "X-Hub-Signature-256": f"sha256={sig}", "Content-Type": "application/json"}
status, body = request('POST', f'/cicd/webhooks/github/{source_id}', data=payload.encode('utf-8'), headers=headers)
print(f"Webhook correct sig: {status} {body}")

print("Wrong signature")
headers_wrong = {"X-GitHub-Event": "workflow_run", "X-Hub-Signature-256": "sha256=abcdef123456", "Content-Type": "application/json"}
status, body = request('POST', f'/cicd/webhooks/github/{source_id}', data=payload.encode('utf-8'), headers=headers_wrong)
print(f"Webhook wrong sig: {status} {body}")

print("Unknown source ID")
status, body = request('POST', '/cicd/webhooks/github/99999', data=payload.encode('utf-8'), headers=headers)
print(f"Webhook unknown source: {status} {body}")

print("Event type push")
headers_push = {"X-GitHub-Event": "push", "X-Hub-Signature-256": f"sha256={sig}", "Content-Type": "application/json"}
status, body = request('POST', f'/cicd/webhooks/github/{source_id}', data=payload.encode('utf-8'), headers=headers_push)
print(f"Webhook push event: {status} {body}")

print("Test 6: Check stored run")
status, body = request('GET', '/cicd/runs', headers=auth_header)
print(f"Runs: {status} {body}")

print("Duplicate payload")
status, body = request('POST', f'/cicd/webhooks/github/{source_id}', data=payload.encode('utf-8'), headers=headers)
print(f"Webhook duplicate: {status} {body}")

print("Test 6: Check incidents")
status, body = request('GET', '/incidents', headers=auth_header)
print(f"Incidents: {status} {body}")
