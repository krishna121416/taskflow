const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const jobRoutes = require('./routes/jobs');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/jobs', jobRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API] Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
