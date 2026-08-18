const { initOpsPilot, flushLogs } = require('./index');

// Initialize with a local webhook URL
initOpsPilot({
  webhookUrl: 'http://localhost:8083/api/v1/ingest/webhook/2', // Using source_id 2 (app_logs)
  sourceService: 'test-sdk-service',
  batchSize: 3, // Flush after 3 logs for testing
});

console.log("This is a normal log message.");
console.info("Here is some info with an object:", { user: "jestin", id: 123 });
console.warn("Watch out, this is a warning!");
console.error("An error occurred during processing.");

// Simulate an unhandled rejection
Promise.reject(new Error("Simulated unhandled promise rejection!"));

// Flush explicitly and exit after a short delay to ensure fetch completes
setTimeout(async () => {
  await flushLogs();
  console.log("Test finished!");
  process.exit(0);
}, 2000);
