const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

let config = {
  webhookUrl: null,
  sourceService: 'unknown-service',
  batchSize: 10,
  flushIntervalMs: 5000,
};

let logBuffer = [];
let flushTimer = null;

function formatMessage(args) {
  return args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

function captureLog(level, args) {
  const message = formatMessage(args);
  const logEntry = {
    level: level.toUpperCase(),
    message: message,
    timestamp: new Date().toISOString(),
    sourceService: config.sourceService,
  };
  
  logBuffer.push(logEntry);

  if (logBuffer.length >= config.batchSize) {
    flushLogs();
  }
}

async function flushLogs() {
  if (logBuffer.length === 0 || !config.webhookUrl) return;

  const logsToSend = [...logBuffer];
  logBuffer = [];

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logsToSend),
    });
    
    if (!response.ok) {
      originalConsole.error('[OpsPilot] Failed to send logs:', response.status, response.statusText);
      originalConsole.error('Body:', await response.text());
    }
  } catch (error) {
    originalConsole.error('[OpsPilot] Error sending logs:', error.message);
  }
}

function initOpsPilot(options = {}) {
  config = { ...config, ...options };

  if (!config.webhookUrl) {
    originalConsole.warn('[OpsPilot] Webhook URL is missing. Logs will not be sent.');
    return;
  }

  // Override console methods
  console.log = (...args) => {
    originalConsole.log(...args);
    captureLog('INFO', args);
  };

  console.info = (...args) => {
    originalConsole.info(...args);
    captureLog('INFO', args);
  };

  console.warn = (...args) => {
    originalConsole.warn(...args);
    captureLog('WARN', args);
  };

  console.error = (...args) => {
    originalConsole.error(...args);
    captureLog('ERROR', args);
  };

  console.debug = (...args) => {
    originalConsole.debug(...args);
    captureLog('DEBUG', args);
  };

  // Capture Uncaught Exceptions
  process.on('uncaughtException', (err) => {
    originalConsole.error('Uncaught Exception:', err);
    captureLog('FATAL', [err.stack || err.message]);
    flushLogs().then(() => {
      process.exit(1);
    });
  });

  // Capture Unhandled Rejections
  process.on('unhandledRejection', (reason, promise) => {
    originalConsole.error('Unhandled Rejection at:', promise, 'reason:', reason);
    captureLog('ERROR', ['Unhandled Rejection:', reason]);
    flushLogs();
  });

  // Set up periodic flush
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(flushLogs, config.flushIntervalMs);
  
  originalConsole.info(`[OpsPilot] Logger initialized for service: ${config.sourceService}`);
}

module.exports = {
  initOpsPilot,
  flushLogs // Exposed for manual flushing if needed (e.g. serverless environments)
};
