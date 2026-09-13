function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Each handler receives (payload, ctx) where ctx = { attemptNumber, maxAttempts }.
 * Handlers either resolve (success) or throw (failure) - BullMQ's retry
 * mechanism is what decides what happens next, handlers never retry
 * themselves.
 */
const handlers = {
  async 'send-email'(payload) {
    await sleep(2000);
    return { message: `Email simulated for ${payload.email || 'unknown recipient'}` };
  },

  async 'process-data'(payload) {
    await sleep(3000);
    return { message: 'Data processing simulated successfully' };
  },

  // Deterministically fails on attempts 1 and 2, succeeds on attempt 3+.
  // `attemptNumber` comes from a count of persisted AttemptHistory rows in
  // MongoDB (see worker.js), NOT a variable held in worker memory - a
  // different worker process may pick up attempt 2 or 3, and this must
  // still behave correctly.
  async 'fail-twice'(payload, { attemptNumber }) {
    if (attemptNumber < 3) {
      throw new Error(`Simulated failure on attempt ${attemptNumber} (fail-twice always fails before attempt 3)`);
    }
    return { message: `fail-twice succeeded on attempt ${attemptNumber}` };
  },

  async 'always-fail'() {
    throw new Error('Simulated permanent failure (always-fail never succeeds)');
  },
};

module.exports = { handlers };
