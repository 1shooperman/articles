// Suppress console.log and console.warn during tests
global.console = {
  ...console,
  log: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  info: jest.fn(() => {}),
  debug: jest.fn(() => {}),
  // Keep error for actual errors
  error: console.error,
};
