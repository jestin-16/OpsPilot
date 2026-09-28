#!/usr/bin/env bash
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"devops@opspilot.io","password":"Password123!"}' http://localhost:8080/api/v1/auth/login | python -c 'import sys,json; print(json.load(sys.stdin).get("token", ""))')
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/kubernetes/pods | python -m json.tool
