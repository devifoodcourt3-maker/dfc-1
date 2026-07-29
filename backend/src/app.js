require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();
app.set('trust proxy', 1); // Trust Render's reverse proxy for real client IPs
const httpServer = http.createServer(app);

// ── Initialize Socket.IO ──────────────────────────────────────────────────────
initSocket(httpServer);

// ── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 200 to 1000 requests per 15 minutes
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many order attempts. Please wait 10 minutes.' },
});

app.use('/api', limiter);
app.use('/api/restaurants/:restaurantId/orders', orderLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DFC Restaurant API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 DFC Restaurant API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API base: http://localhost:${PORT}/api\n`);

  // Auto Keep-Alive Self-Ping (prevents Render free tier from sleeping)
  const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
  if (renderUrl) {
    const PING_INTERVAL = 12 * 60 * 1000; // 12 minutes (Render sleeps after 15m)
    setInterval(() => {
      const pingUrl = `${renderUrl.replace(/\/$/, '')}/health`;
      const protocol = pingUrl.startsWith('https') ? require('https') : require('http');
      protocol.get(pingUrl, (res) => {
        console.log(`[Keep-Alive Ping] ${new Date().toISOString()} -> ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('[Keep-Alive Ping Error]', err.message);
      });
    }, PING_INTERVAL);
    console.log(`📡 Keep-Alive self-ping initialized for: ${renderUrl}/health (every 12m)`);
  }
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  httpServer.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
