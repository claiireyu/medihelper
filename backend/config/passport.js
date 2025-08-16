import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

export function configurePassport(db) {
  // Serialize user for session storage
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        done(null, result.rows[0]);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error, false);
    }
  });

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value
      });

      // Check if user already exists with this Google ID
      let result = await db.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
      
      if (result.rows.length > 0) {
        // User exists, update their info and return
        const updateQuery = `
          UPDATE users 
          SET name = $1, email = $2, avatar_url = $3 
          WHERE google_id = $4 
          RETURNING *
        `;
        const updateResult = await db.query(updateQuery, [
          profile.displayName,
          profile.emails?.[0]?.value,
          profile.photos?.[0]?.value,
          profile.id
        ]);
        console.log('Updated existing user:', updateResult.rows[0]);
        return done(null, updateResult.rows[0]);
      }

      // Check if a user with this email already exists (local account)
      if (profile.emails?.[0]?.value) {
        result = await db.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
        
        if (result.rows.length > 0) {
          // Link Google account to existing local account
          const linkQuery = `
            UPDATE users 
            SET google_id = $1, avatar_url = $2, auth_provider = 'google' 
            WHERE email = $3 
            RETURNING *
          `;
          const linkResult = await db.query(linkQuery, [
            profile.id,
            profile.photos?.[0]?.value,
            profile.emails[0].value
          ]);
          console.log('Linked Google account to existing user:', linkResult.rows[0]);
          return done(null, linkResult.rows[0]);
        }
      }

      // Create new user
      const insertQuery = `
        INSERT INTO users (name, email, google_id, avatar_url, auth_provider) 
        VALUES ($1, $2, $3, $4, 'google') 
        RETURNING *
      `;
      const insertResult = await db.query(insertQuery, [
        profile.displayName,
        profile.emails?.[0]?.value,
        profile.id,
        profile.photos?.[0]?.value
      ]);
      
      console.log('Created new user:', insertResult.rows[0]);
      return done(null, insertResult.rows[0]);

    } catch (error) {
      console.error('Error in Google OAuth strategy:', error);
      return done(error, false);
    }
  }));

  return passport;
}