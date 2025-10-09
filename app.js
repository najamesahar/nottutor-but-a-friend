require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const passportConfig = require('./controllers/authController'); // Import the config

const app = express();

// Initialize Passport with the strategy
passportConfig; // This triggers the strategy setup

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public')); // Serves index.html, css/, and js/ statically

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Authentication status
app.get('/auth/status', (req, res) => {
  console.log('Auth status check, isAuthenticated:', req.isAuthenticated(), 'User:', req.user);
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: { _id: req.user._id, role: req.user.role } });
  } else {
    res.json({ authenticated: false });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Route Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message }); // Return JSON with details
});

// Unhandled promise rejection and exception handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason.stack || reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Database connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));