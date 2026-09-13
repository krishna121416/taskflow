// Runs before the test framework loads any application code. Points the
// app at a dedicated test database and a dedicated BullMQ queue name so
// running tests never touches (or races with) dev data / dev jobs.
// dotenv.config() (called later, inside src/config/env.js) never
// overwrites variables that are already set, so these values win.
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/taskflow_test';
process.env.QUEUE_NAME = 'taskflow-jobs-test';
process.env.BACKOFF_DELAY_MS = '500'; // keep retry tests fast but still observably exponential
