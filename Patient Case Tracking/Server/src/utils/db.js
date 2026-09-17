import dns from 'dns';
import mongoose from 'mongoose';
import { logger } from './logger.js';

// Resolve DNS SRV lookup issues on Windows / ISP DNS by setting reliable resolvers (Google & Cloudflare)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  logger.warn('Failed to configure custom DNS servers for SRV resolution:', dnsErr);
}

/**
 * Initialize MongoDB connection pool with auto-reconnect and lifecycle event handlers
 */
export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;

  if (!primaryUri) {
    logger.error('MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(primaryUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected successfully to database: ${conn.connection.name} on ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Failed to establish MongoDB connection: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => {
  logger.info('[Mongoose]: Connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error('[Mongoose]: Connection error encountered:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[Mongoose]: Connection disconnected. Retrying...');
});

// Graceful termination handling
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('[Mongoose]: Connection gracefully closed due to application termination (SIGINT)');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    logger.info('[Mongoose]: Connection gracefully closed due to application termination (SIGTERM)');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

export default connectDB;
