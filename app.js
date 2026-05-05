require('dotenv').config();
const express = require('express'); // 1. Define express first
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const passportConfig = require('./controllers/authController');

const app = express(); // 2. Then initialize app

// Render/Proxy Settings
app.set('trust proxy', 1); // 3. Now this line will work correctly

// Initialize Passport strategy
passportConfig; 

// Security Middleware
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

// Body parsing & session
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-please-change',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' // 4. Add this to help with the login redirect loop
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Auth status endpoint
app.get('/auth/status', (req, res) => {
  console.log('Auth status check:', req.isAuthenticated() ? req.user._id : 'not authenticated');
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: { _id: req.user._id, role: req.user.role, name: req.user.name }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal server error'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
