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

// Seed endpoint - populate test data
app.post('/api/seed', async (req, res) => {
  try {
    const { Tutor, Batch, Student, Team, TeamMember, TaskPhase } = require('./models');
    const bcrypt = require('bcryptjs');

    console.log('🌱 Seeding database...');

    // Find or create tutors
    const tutors = await Promise.all([
      Tutor.findOrCreate({
        where: { email: 'john.smith@university.edu' },
        defaults: {
          name: 'John Smith',
          email: 'john.smith@university.edu',
          department: 'Computer Science',
          password: await bcrypt.hash('password123', 10)
        }
      }),
      Tutor.findOrCreate({
        where: { email: 'sarah.johnson@university.edu' },
        defaults: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@university.edu',
          department: 'Computer Science',
          password: await bcrypt.hash('password123', 10)
        }
      })
    ]);

    // Find or create batch
    const batch = await Batch.findOrCreate({
      where: { year: 2024, department: 'Computer Science' },
      defaults: {
        year: 2024,
        department: 'Computer Science',
        branch: 'A',
        section: 'I'
      }
    });

    // Find or create students
    const students = await Promise.all([
      Student.findOrCreate({
        where: { email: 'alice@university.edu' },
        defaults: {
          name: 'Alice Johnson',
          email: 'alice@university.edu',
          batch_id: batch[0].batch_id,
          password: await bcrypt.hash('password123', 10)
        }
      }),
      Student.findOrCreate({
        where: { email: 'bob@university.edu' },
        defaults: {
          name: 'Bob Smith',
          email: 'bob@university.edu',
          batch_id: batch[0].batch_id,
          password: await bcrypt.hash('password123', 10)
        }
      })
    ]);

    // Create task phases
    await TaskPhase.findOrCreate({
      where: { batch_id: batch[0].batch_id, name: 'Assignment 1' },
      defaults: {
        batch_id: batch[0].batch_id,
        name: 'Assignment 1',
        description: 'Complete the first assignment',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Create team and assign members
    const team = await Team.findOrCreate({
      where: { batch_id: batch[0].batch_id, name: 'Team 1' },
      defaults: {
        batch_id: batch[0].batch_id,
        name: 'Team 1'
      }
    });

    await TeamMember.findOrCreate({
      where: { team_id: team[0].team_id, student_id: students[0][0].student_id },
      defaults: {
        team_id: team[0].team_id,
        student_id: students[0][0].student_id,
        role: 'member'
      }
    });

    await TeamMember.findOrCreate({
      where: { team_id: team[0].team_id, student_id: students[1][0].student_id },
      defaults: {
        team_id: team[0].team_id,
        student_id: students[1][0].student_id,
        role: 'member'
      }
    });

    res.json({
      success: true,
      message: '✨ Database seeded successfully!',
      data: {
        tutors: tutors.length,
        batches: 1,
        students: students.length,
        teams: 1
      }
    });
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    res.status(500).json({
      success: false,
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
