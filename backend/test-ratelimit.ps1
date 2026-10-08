for ($i = 1; $i -le 3; $i++) {
    $response = curl.exe -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/ingest/metrics/push -H "Authorization: Bearer opl_testtoken12345678901234567890" -H "Content-Type: application/x-protobuf" -H "Content-Encoding: snappy" --data-binary "@payload.snappy"
    Write-Host "Request $i returned HTTP $response"
}
