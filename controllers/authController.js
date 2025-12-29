const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await Tutor.findById(id);
    if (!user) user = await Student.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const isStudent = email.endsWith('@student.mentora.app') || email.includes('test.student'); // Add flexibility if needed
    const UserModel = isStudent ? Student : Tutor;

    let user = await UserModel.findOne({ googleId: profile.id });
    if (!user) {
      user = new UserModel({
        googleId: profile.id,
        email: email,
        name: profile.displayName,
        role: isStudent ? 'student' : 'tutor'
      });
      await user.save();
      console.log('New user created:', user.email, user.role);
    } else {
      console.log('Existing user logged in:', user.email, user.role);
    }

    return done(null, user);
  } catch (err) {
    console.error('Error in Google Strategy:', err);
    return done(err, null);
  }
  }));
} else {
  console.warn('Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.');
}

module.exports = passport;