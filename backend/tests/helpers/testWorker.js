const { spawn } = require('child_process');
const path = require('path');

/**
 * Spawns a real worker PROCESS (node src/workers/worker.js) rather than
 * calling worker code in-process. This is deliberate: the whole point of
 * these tests is to prove that separate OS processes coordinate correctly
 * through Redis/BullMQ, which an in-process mock would not demonstrate.
 */
function spawnWorker(label) {
  const child = spawn(process.execPath, [path.join(__dirname, '..', '..', 'src', 'workers', 'worker.js')], {
    env: process.env,
    stdio: 'pipe',
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[test-worker:${label}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[test-worker:${label}] ${chunk}`);
  });

  return new Promise((resolve) => {
    const onData = (chunk) => {
      if (chunk.toString().includes('Ready and listening')) {
        child.stdout.off('data', onData);
        resolve(child);
      }
    };
    child.stdout.on('data', onData);
  });
}

function killWorker(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) return resolve();
    child.once('exit', resolve);
    child.kill('SIGTERM');
  });
}

module.exports = { spawnWorker, killWorker };
