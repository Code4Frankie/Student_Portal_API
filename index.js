import 'dotenv/config';
import mongoose from 'mongoose';

import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and set a secret.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set. Copy .env.example to .env and add your Atlas connection string.');
  process.exit(1);
}

// Dynamic import so the env checks above run before app.js (and everything
// it pulls in, like middleware/auth.js) is evaluated.
const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3000;

/** Connects to MongoDB Atlas using the MONGODB_URI from the environment. */
function connectDB() {
  mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB Atlas.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  return mongoose.connect(process.env.MONGODB_URI);
}

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Student Portal API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
