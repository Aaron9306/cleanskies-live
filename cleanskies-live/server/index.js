const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const airQualityRoutes = require('./routes/airQuality');
const userRoutes = require('./routes/user');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting (relaxed for development and key endpoints)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip in non-production to avoid blocking local dev
    if ((process.env.NODE_ENV || 'development') !== 'production') return true;
    // Always allow health and temp-token
    const skipPaths = new Set(['/api/health', '/api/auth/temp-token']);
    if (skipPaths.has(req.path)) return true;
    return false;
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB (optional)
const isDatabaseEnabled = String(process.env.USE_DB || 'false') !== 'false';

if (isDatabaseEnabled) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cleanskies-live', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
} else {
  console.log('ℹ️  Database is disabled (USE_DB=false). Running in stateless mode.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/airquality', airQualityRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
