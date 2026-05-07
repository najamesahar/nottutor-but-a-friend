require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route & Config Imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const passportConfig = require('./controllers/authController');

const app = express();

// 1. PROXY SETTINGS (Crucial for Render/Google Login)
app.set('trust proxy', 1); 

// 2. MIDDLEWARE
app.use(helmet()); 

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. SESSION SETUP
app.use(session({
  secret: process.env.SESSION_SECRET || 'nottutor-fallback-secret',
  resave: true, // Force save for login persistence
  saveUninitialized: false,
  proxy: true, 
  cookie: { 
    secure: true, // Required for Render HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 4. PASSPORT & STATIC FILES
passportConfig; // Initialize Google Strategy
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

// 5. ROUTES
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Main entry point
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Auth check for debugging
app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: { _id: req.user._id, role: req.user.role, name: req.user.name }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// 6. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal server error'
  });
});

// 7. DATABASE & SERVER START
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Cloud');

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`NotTutor is live on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

// Process handling
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
  process.exit(1);
});

startServer();

module.exports = app;