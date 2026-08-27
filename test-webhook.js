const http = require('http');

const publicId = process.argv[2];
const secret = process.argv[3];

if (!publicId || !secret) {
  console.log("Usage: node test-webhook.js <publicId> <secret>");
  process.exit(1);
}

const data = JSON.stringify({
  sourceService: 'test-app',
  logLevel: 'INFO',
  message: 'Hello OpsPilot wizard!'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: `/api/v1/ingest/webhook/${publicId}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret,
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
