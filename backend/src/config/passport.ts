import dotenv from 'dotenv';
import { and, eq } from 'drizzle-orm';
import passport from 'passport';
import {
  type Profile as GoogleProfile,
  Strategy as GoogleStrategy,
  type VerifyCallback,
} from 'passport-google-oauth20';
import { db, schema } from '../db';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Configure Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: VerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from Google profile'));
          }

          // Check if user with this OAuth provider and ID exists
          let user = await db.query.users.findFirst({
            where: and(
              eq(schema.users.oauthProvider, 'google'),
              eq(schema.users.oauthId, profile.id)
            ),
          });

          if (!user) {
            // Check if user with same email exists
            const existingUser = await db.query.users.findFirst({
              where: eq(schema.users.email, email),
            });

            if (existingUser) {
              // Security: Do not automatically link OAuth to existing accounts
              // This prevents account takeover attacks
              return done(
                new Error(
                  'An account with this email already exists. Please log in with your existing credentials.'
                )
              );
            }

            // Create new user
            [user] = await db
              .insert(schema.users)
              .values({
                email,
                username: `google_${profile.id}`,
                displayName: profile.displayName || null,
                profileImageUrl: profile.photos?.[0]?.value || null,
                oauthProvider: 'google',
                oauthId: profile.id,
                role: 'user',
              })
              .returning();
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Passport serialization/deserialization is not strictly needed since we use JWT,
// but it's good practice for Passport's internal flow during the callback phase.
passport.serializeUser((user: Express.User, done) => {
  const dbUser = user as { id?: number };
  done(null, dbUser.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    done(null, user || undefined);
  } catch (error) {
    done(error);
  }
});

export default passport;
