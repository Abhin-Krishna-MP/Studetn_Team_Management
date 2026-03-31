require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

const rateLimit = require('express-rate-limit');

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all requests
app.use('/api', limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err));

// Sample route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Team Management API',
    status: 'Running'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'healthy',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const tutorRoutes = require('./routes/tutor');
const studentRoutes = require('./routes/students');
const draftRoutes = require('./routes/drafts');
const submissionRoutes = require('./routes/submissions');
const { authenticate } = require('./middleware/auth');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/tutor', tutorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/drafts', authenticate, draftRoutes);
app.use('/api/submissions', authenticate, submissionRoutes);
app.use('/api', authenticate, draftRoutes); // For /api/teams/:team_id/velocity/:phase_id

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Custom file filter errors
  if (err.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Generic error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Import and use routes here
// app.use('/api/tutors', require('./routes/tutors'));
// app.use('/api/students', require('./routes/students'));
// etc...

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
