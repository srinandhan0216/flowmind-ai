import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Render health checks, curl, mobile apps)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000'
      ].filter(Boolean);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Root & Health routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to FlowMind AI Backend API',
    status: 'online',
    version: '1.0.0',
    documentation: '/health'
  });
});

// GET /health endpoint returning { "status": "ok" }
app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.url}`
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server listening on 0.0.0.0 and dynamic PORT for Render
app.listen(Number(PORT), HOST, () => {
  console.log(`=========================================`);
  console.log(`🚀 FlowMind AI Backend is running!`);
  console.log(`📡 URL: http://${HOST}:${PORT}`);
  console.log(`🩺 Health: http://${HOST}:${PORT}/health`);
  console.log(`🌐 Allowed Origin: ${FRONTEND_URL}`);
  console.log(`=========================================`);
});


export default app;
