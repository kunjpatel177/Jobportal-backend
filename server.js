const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security headers with Helmet - configured so it doesn't block cross-origin requests/resumes
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(morgan('dev'));

// Permissive dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'https://jobportal-gamma-six.vercel.app',
  process.env.CLIENT_URL
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, ''));

// 1. Manual CORS Headers Fallback Middleware (Guarantees CORS headers even on 4xx/5xx errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith('.vercel.app') ||
      normalizedOrigin.includes('localhost') ||
      process.env.NODE_ENV !== 'production';

    // In production, dynamically reflect any origin or match allowed patterns
    if (isAllowed || true) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // Non-browser or server-to-server requests
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, X-CSRF-Token'
  );

  // Fast-respond to preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// 2. Standard CORS Middleware with dynamic origin reflection
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }

      // Permissive fallback so production frontend is never blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['Set-Cookie']
  })
);

// Explicit preflight handler
app.options('*', cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoints (Fast return without waiting for DB)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Job Application Portal API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Middleware to ensure DB connection is established before processing API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(`[DB Middleware Error] ${err.message}`);
    return res.status(500).json({
      success: false,
      message:
        'Database connection failed. Please verify MONGO_URI in your Vercel Project Environment Variables and ensure MongoDB Atlas Network Access has 0.0.0.0/0 (Allow access from anywhere) enabled.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Standalone Server startup (Only when running locally or on traditional VPS, not on Vercel serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
}

// Export Express app for Vercel Serverless Function runtime
module.exports = app;
