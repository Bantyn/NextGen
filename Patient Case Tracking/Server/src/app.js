import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import documentRoutes from './routes/documentRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/intake', intakeRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MediKiosk Patient Tracking Server is running on network',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server listening on network: http://${HOST}:${PORT}`);
});

// Process crash protection
process.on('uncaughtException', (err) => {
  console.error('[Global Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Global Unhandled Rejection]:', reason);
});

export default app;
