require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route & Config Imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const passportConfig = require('./controllers/authController');

const app = express();

// 1. PROXY SETTINGS (Crucial for Render & Google OAuth)
// This must be set before any middleware that uses the connection
app.set('trust proxy', 1); 

// 2. SECURITY MIDDLEWARE
app.use(helmet()); 

// Rate Limiting (configured to trust Render's X-Forwarded-For header)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Prevents the ERL_UNEXPECTED error in Render logs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// 3. BODY PARSING
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. SESSION SETUP with MongoDB persistence
app.use(session({
  secret: process.env.SESSION_SECRET || 'nottutor-fallback-secret',
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't save empty sessions
  proxy: true, // Explicitly tell express-session to trust the proxy
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // Lazy session update (in seconds)
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (Render)
    httpOnly: true, // Prevent client-side JS from accessing the cookie
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 5. PASSPORT & STATIC FILES
passportConfig; // Initialize Google Strategy and serialization
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

// 6. ROUTES
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Root route - serves your dashboard/landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Auth status endpoint for debugging login loops
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

// 7. GLOBAL ERROR HANDLING
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal server error'
  });
});

// 8. DATABASE CONNECTION & SERVER START
async function startServer() {
  try {
    // We only connect to the database and start the listener if we ARE NOT in a test environment
    if (process.env.NODE_ENV !== 'test') {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB Cloud');

      const PORT = process.env.PORT || 10000;
      app.listen(PORT, () => {
        console.log(`NotTutor is live on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('Database connection error:', err);
    // Only exit the process if we aren't testing
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

// Process-level error handling
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
});

// Execute the startup
startServer();

// Export for Jest testing
module.exports = app;
