import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile as GoogleProfile, type VerifyCallback } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GitHub profile type
interface GitHubProfile {
  id: string;
  username?: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

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
              // Link OAuth to existing user
              [user] = await db
                .update(schema.users)
                .set({
                  oauthProvider: 'google',
                  oauthId: profile.id,
                })
                .where(eq(schema.users.id, existingUser.id))
                .returning();
            } else {
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
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Configure GitHub OAuth Strategy
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: (error: Error | null, user?: unknown) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

          let user = await db.query.users.findFirst({
            where: and(
              eq(schema.users.oauthProvider, 'github'),
              eq(schema.users.oauthId, profile.id)
            ),
          });

          if (!user) {
            const existingUser = await db.query.users.findFirst({
              where: eq(schema.users.email, email),
            });

            if (existingUser) {
              [user] = await db
                .update(schema.users)
                .set({
                  oauthProvider: 'github',
                  oauthId: profile.id,
                })
                .where(eq(schema.users.id, existingUser.id))
                .returning();
            } else {
              [user] = await db
                .insert(schema.users)
                .values({
                  email,
                  username: profile.username || `github_${profile.id}`,
                  displayName: profile.displayName || profile.username || null,
                  profileImageUrl: profile.photos?.[0]?.value || null,
                  oauthProvider: 'github',
                  oauthId: profile.id,
                  role: 'user',
                })
                .returning();
            }
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
