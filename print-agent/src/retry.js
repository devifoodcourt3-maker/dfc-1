const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs fn(), retrying on failure with the given delay schedule.
 * Rethrows the last error once attempts are exhausted so the caller can
 * report the job as failed.
 */
async function withRetry(fn, { attempts = 3, delays = [1000, 3000, 5000], onAttemptFailed } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (onAttemptFailed) onAttemptFailed(err, attempt);
      if (attempt < attempts) {
        await sleep(delays[attempt - 1] ?? delays[delays.length - 1]);
      }
    }
  }
  throw lastError;
}

module.exports = { withRetry };
