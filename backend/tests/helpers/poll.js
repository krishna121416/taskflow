async function waitFor(conditionFn, { timeoutMs = 20000, intervalMs = 200 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await conditionFn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('waitFor: condition not met before timeout');
}

module.exports = { waitFor };
