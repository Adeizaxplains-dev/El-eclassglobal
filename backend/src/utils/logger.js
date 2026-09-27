/**
 * Minimal structured logger. Swap for pino/winston later without
 * touching call sites — everything imports `logger` from here.
 *
 * Rule: never pass secrets (tokens, passwords, card data) into meta.
 */
function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta) {
  const line = { timestamp: timestamp(), level, message, ...(meta ? { meta } : {}) };
  const serialized = JSON.stringify(line);
  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
