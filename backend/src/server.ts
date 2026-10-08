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
// Parse FRONTEND_URL supporting comma-separated domains and trimming trailing slashes
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000'
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultDevOrigins]));

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. Render health checks, curl, cron)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/$/, '');

      // Allow wildcard if configured
      if (process.env.FRONTEND_URL === '*' || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Check allowed origins
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow Vercel preview and production subdomains
      if (normalizedOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Permissive in non-production
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
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
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`=========================================`);
});


export default app;
