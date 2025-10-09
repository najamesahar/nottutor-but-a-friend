// controllers/authController.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await Tutor.findById(id) || await Student.findById(id);
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  console.log('Google Strategy called with profile:', profile);
  try {
    const email = profile.emails[0].value;
    const isStudent = email.endsWith('@student.mentora.app');
    const UserModel = isStudent ? Student : Tutor;

    let user = await UserModel.findOne({ googleId: profile.id });
    console.log('User found or to be created:', user ? 'existing' : 'new');
    if (!user) {
      user = new UserModel({
        googleId: profile.id,
        email: email,
        name: profile.displayName,
        role: isStudent ? 'student' : 'tutor'
      });
      await user.save();
      console.log('New user saved:', user);
    }
    return done(null, user);
  } catch (err) {
    console.error('Error in Google Strategy:', err);
    return done(err, null);
  }
}));

module.exports = passport;