const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectMongo() {
  mongoose.connection.on('connected', () => {
    console.log(`[Mongo] connected to ${mongoUri}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[Mongo] connection error:', err.message);
  });

  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

// mongoose.connection.readyState: 0 = disconnected, 1 = connected,
// 2 = connecting, 3 = disconnecting.
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectMongo, isMongoConnected, mongoose };
