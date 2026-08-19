const { initOpsPilot, flushLogs, requestTracker } = require('./index');

// Initialize with a local webhook URL
initOpsPilot({
  webhookUrl: 'http://localhost:8083/api/v1/ingest/webhook/2', // Using source_id 2 (app_logs)
  sourceService: 'test-sdk-service',
  batchSize: 3, // Flush after 3 logs for testing
  metricsIntervalMs: 2000, // Flush metrics every 2 seconds for testing
});

console.log("This is a normal log message.");
console.info("Here is some info with an object:", { user: "jestin", id: 123 });
console.warn("Watch out, this is a warning!");
console.error("An error occurred during processing.");

// Simulate an unhandled rejection
Promise.reject(new Error("Simulated unhandled promise rejection!"));

// Simulate Express request tracker
const req = {}; const res = { on: (event, cb) => setTimeout(cb, 3000) };
requestTracker(req, res, () => {
  console.log("Simulating an active HTTP request...");
});

// Flush explicitly and exit after a short delay to ensure fetch completes and metrics run at least once
setTimeout(async () => {
  await flushLogs();
  console.log("Test finished!");
  process.exit(0);
}, 6000);
