const express = require('express');
const router = express.Router();
const passport = require('passport');

// Google OAuth login route
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback route
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: '/'
  }),
  (req, res) => {
    console.log('Google OAuth successful for user:', req.user.email);
    res.redirect('/');
  }
);

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
      res.redirect('/');
    });
  });
});

module.exports = router;