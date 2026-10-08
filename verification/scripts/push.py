import requests
import snappy
import time
import json
import sys

# Requirements: pip install requests python-snappy protobuf

# Note: You'd need Prometheus protobuf definitions to construct WriteRequest.
# For demonstration in Python without compiling protos, we can send pre-compiled binary or skip it.
# This script sends a Loki push payload.

def push_loki(url, token, project, source):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    payload = {
        "streams": [
            {
                "stream": {
                    "container": "test-container",
                    "project": project,
                    "source": source
                },
                "values": [
                    [str(int(time.time() * 1e9)), "INFO This is a test log"]
                ]
            }
        ]
    }
    
    print(f"Pushing to Loki: {url}")
    resp = requests.post(url, headers=headers, json=payload)
    print(f"Status: {resp.status_code}")
    print(resp.text)

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: push.py <loki_url> <token> <project> <source>")
        sys.exit(1)
    
    push_loki(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
