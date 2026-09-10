import mongoose from 'mongoose';
import { logger } from './logger.js';

/**
 * Initialize MongoDB connection pool with auto-reconnect and lifecycle event handlers
 */
export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medikiosk_patient_tracking';
  const localFallbackUri = 'mongodb://127.0.0.1:27017/medikiosk_patient_tracking';

  try {
    const conn = await mongoose.connect(primaryUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected successfully to database: ${conn.connection.name} on ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.warn(`Failed to establish primary MongoDB connection: ${error.message}. Attempting local fallback...`);

    if (primaryUri !== localFallbackUri) {
      try {
        const localConn = await mongoose.connect(localFallbackUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 3000,
          socketTimeoutMS: 45000,
        });
        logger.info(`MongoDB Local Fallback Connected successfully to database: ${localConn.connection.name} on ${localConn.connection.host}`);
        return localConn;
      } catch (localErr) {
        logger.error('Failed to establish local MongoDB fallback connection as well:', localErr);
      }
    }

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
