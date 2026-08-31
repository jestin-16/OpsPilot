const { initOpsPilot, flushLogs } = require('./index.js');

const webhookUrl = process.env.OPSPILOT_WEBHOOK_URL;
const sourceService = process.env.OPSPILOT_SOURCE_SERVICE || 'notes-app';

if (!webhookUrl) {
  console.error('Missing OPSPILOT_WEBHOOK_URL. Set it in your environment before running this script.');
  process.exit(1);
}

initOpsPilot({
  webhookUrl,
  sourceService,
  batchSize: 10,
  flushIntervalMs: 5000,
});

console.log('OpsPilot smoke test started');
console.info('Application started successfully');
console.warn('Sample warning log');
console.error('Sample error log');

setTimeout(async () => {
  await flushLogs();
  console.log('OpsPilot smoke test finished');
  process.exit(0);
}, 1200);
