const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

let config = {
  webhookUrl: null,
  metricsUrl: null,
  sourceService: 'unknown-service',
  batchSize: 10,
  flushIntervalMs: 5000,
  metricsIntervalMs: 15000,
};

let logBuffer = [];
let flushTimer = null;
let metricsTimer = null;

// APM Metrics Tracking
let activeRequests = 0;
let lastCpuUsage = process.cpuUsage();

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

async function flushMetrics() {
  if (!config.metricsUrl) return;

  const memUsage = process.memoryUsage();
  const currentCpuUsage = process.cpuUsage();
  
  // Calculate CPU percentage since last check
  const userDiff = currentCpuUsage.user - lastCpuUsage.user;
  const sysDiff = currentCpuUsage.system - lastCpuUsage.system;
  lastCpuUsage = currentCpuUsage;
  
  const cpuPercent = ((userDiff + sysDiff) / 1000) / config.metricsIntervalMs * 100;

  const metrics = {
    timestamp: new Date().toISOString(),
    sourceService: config.sourceService,
    memoryBytes: memUsage.rss,
    cpuPercent: Math.max(0, cpuPercent),
    activeRequests: activeRequests,
  };

  try {
    const response = await fetch(config.metricsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics),
    });
    
    if (!response.ok) {
      originalConsole.error('[OpsPilot] Failed to send metrics:', response.status, response.statusText);
    }
  } catch (error) {
    originalConsole.error('[OpsPilot] Error sending metrics:', error.message);
  }
}

// Express Middleware to track active HTTP requests
function requestTracker(req, res, next) {
  activeRequests++;
  res.on('finish', () => { activeRequests--; });
  res.on('close', () => { activeRequests--; });
  next();
}

function initOpsPilot(options = {}) {
  config = { ...config, ...options };

  // Set default metricsUrl if webhookUrl is provided but metricsUrl is not
  if (config.webhookUrl && !config.metricsUrl) {
     config.metricsUrl = config.webhookUrl.replace('/webhook/', '/metrics/');
  }

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

  // Set up periodic flushes
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(flushLogs, config.flushIntervalMs);
  
  if (metricsTimer) clearInterval(metricsTimer);
  if (config.metricsUrl) {
    metricsTimer = setInterval(flushMetrics, config.metricsIntervalMs);
  }
  
  originalConsole.info(`[OpsPilot] Logger & APM initialized for service: ${config.sourceService}`);
}

module.exports = {
  initOpsPilot,
  flushLogs,
  requestTracker
};
