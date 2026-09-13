const app = require('./app');
const { port } = require('./config/env');
const { connectMongo } = require('./config/db');

async function start() {
  await connectMongo();

  const server = app.listen(port, () => {
    console.log(`[API] TaskFlow API listening on port ${port}`);
  });

  // Graceful shutdown so in-flight requests finish and connections close
  // cleanly instead of being killed mid-write.
  const shutdown = (signal) => {
    console.log(`[API] Received ${signal}, shutting down...`);
    server.close(() => {
      console.log('[API] HTTP server closed');
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[API] Failed to start:', err);
  process.exit(1);
});
