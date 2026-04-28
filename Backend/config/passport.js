import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import pool from './db.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://your-backend.onrender.com/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findByGoogleId(profile.id);

    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findByEmail(profile.emails[0].value);

    if (user) {
      // Link Google account to existing user
      await pool.query(
        'UPDATE users SET google_id = $1 WHERE id = $2',
        [profile.id, user.id]
      );
      user.google_id = profile.id;
      return done(null, user);
    }

    // Create new user
    const newUser = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      google_id: profile.id,
      role: 'customer', // Default role
      verified: true // Google accounts are pre-verified
    });

    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

export default passport;