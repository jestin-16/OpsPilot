# @opspilot/logger

The official OpsPilot Node.js SDK for capturing and streaming logs directly from your application to OpsPilot.

## Features
- Overrides `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug`.
- Captures `uncaughtException` and `unhandledRejection` automatically.
- Batches and flushes logs asynchronously to prevent performance overhead.

## Installation

```bash
npm install opspilot-logger
```

## Usage

Initialize the logger as early as possible in your application lifecycle (e.g., in your `index.js` or `server.js`):

```javascript
const { initOpsPilot } = require('opspilot-logger');

initOpsPilot({
  webhookUrl: 'https://<YOUR_OPSPILOT_URL>/api/v1/ingest/webhook/2',
  sourceService: 'personal-notes-api',
  batchSize: 10,        // optional: number of logs to batch before sending (default 10)
  flushIntervalMs: 5000 // optional: milliseconds to wait before forcing a flush (default 5000)
});

// Now, all standard console logs will be routed to OpsPilot!
console.log("Application started successfully!");
console.warn("This is a warning.");
console.error("This is an error!");
```

### Serverless Environments (Vercel Functions, AWS Lambda)
If you are running in a serverless environment where the process might exit before the background flush interval triggers, you can manually flush the logs:

```javascript
const { flushLogs } = require('opspilot-logger');

exports.handler = async function(event, context) {
  console.log("Processing request...");
  
  // ... your logic ...

  await flushLogs(); // ensure all logs are sent before the function exits
  return { status: 200 };
}
```
