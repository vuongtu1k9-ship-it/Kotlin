const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m',
};

const getEnvLevel = () => {
  if (process.env.DEBUG === 'true') return LOG_LEVELS.DEBUG;
  if (process.env.NODE_ENV === 'production') return LOG_LEVELS.INFO;
  return LOG_LEVELS.DEBUG;
};

const CURRENT_LEVEL = getEnvLevel();

import util from 'util';
import fs from 'fs';
import path from 'path';

const logFile = path.resolve(process.cwd(), 'server.log');

const writeToFile = (msg) => {
  try {
    const timestamp = new Date().toISOString();
    // Strip ANSI colors before writing to file
    const cleanMsg = msg.replace(/\x1b\[\d+m/g, '');
    fs.appendFileSync(logFile, `[${timestamp}] ${cleanMsg}\n`);
  } catch (err) {
    // Fail silently
  }
};

const formatMsg = (level, prefix, args) => {
  const timestamp = new Date().toLocaleTimeString();
  const color = COLORS[level] || COLORS.RESET;
  const prefixStr = prefix ? `(${prefix}) ` : '';
  
  const formattedArgs = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack}`;
    }
    if (typeof arg === 'object' && arg !== null) {
      const inspected = util.inspect(arg, { depth: 4, colors: true, showHidden: false });
      // Clear sensitive info
      return inspected.replace(/(password|token|secret)['"]?\s*:\s*['"]?[^'"}]+['"]?/gi, '$1: "***"');
    }
    return arg;
  }).join(' ');

  return `${color}[${timestamp}] ${level}${COLORS.RESET} ${prefixStr}${formattedArgs}`;
};

const createLogger = (prefix = '') => ({
  debug: (...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      const msg = formatMsg('DEBUG', prefix, args);
      console.debug(msg);
      writeToFile(msg);
    }
  },
  info: (...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      const msg = formatMsg('INFO', prefix, args);
      console.info(msg);
      writeToFile(msg);
    }
  },
  warn: (...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      const msg = formatMsg('WARN', prefix, args);
      console.warn(msg);
      writeToFile(msg);
    }
  },
  error: (...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const msg = formatMsg('ERROR', prefix, args);
      console.error(msg);
      writeToFile(msg);
    }
  },
  log: (...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      const msg = formatMsg('INFO', prefix, args);
      console.log(msg);
      writeToFile(msg);
    }
  }
});

const logger = createLogger();

export { logger, createLogger };
export default logger;
