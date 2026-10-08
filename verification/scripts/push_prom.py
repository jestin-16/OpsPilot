import sys
import time
import requests
import snappy

# pip install requests python-snappy protobuf

def push_prometheus(url, token):
    # This is a dummy payload since generating actual remote_write.proto bytes 
    # requires compiling the prometheus protobuf definition.
    # In a real test, you'd serialize a WriteRequest here.
    dummy_payload = b'\x00' * 10 
    
    headers = {
        "Content-Type": "application/x-protobuf",
        "Content-Encoding": "snappy",
        "X-Prometheus-Remote-Write-Version": "0.1.0",
        "Authorization": f"Bearer {token}"
    }
    
    compressed = snappy.compress(dummy_payload)
    print(f"Pushing to Prometheus endpoint: {url}")
    resp = requests.post(url, headers=headers, data=compressed)
    print(f"Status: {resp.status_code}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: push_prom.py <url> <token>")
        sys.exit(1)
    
    push_prometheus(sys.argv[1], sys.argv[2])
