export const logger = {
  debug: (...args: any[]) => console.debug(...args),
  info: (...args: any[]) => console.info(...args),
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

export const setLogLevel = (_level: string): void => {
  // Logic for setting log level can be added here if needed
};

export default logger;
