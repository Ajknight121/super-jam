// src/lib/db.ts
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../db/schema";

type DbClient = DrizzleD1Database<typeof schema>;

/**
 * Finds a user by their Google ID. If the user doesn't exist, it creates a new one.
 * It also updates the user's access and refresh tokens.
 * This is an "upsert" operation.
 * @param db The Drizzle database client.
 * @param googleUser The user profile information from Google.
 * @param tokens The OAuth tokens from Google.
 * @returns The user record from the database.
 */
export async function findOrCreateUser(
  db: DbClient,
  googleUser: { sub: string; email: string; name: string; picture: string },
  tokens: { accessToken: string; refreshToken: string | null }
) {
  const [user] = await db
    .insert(schema.users)
    .values({
      id: nanoid(), // Generate a unique ID for our system
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
      googleAccessToken: tokens.accessToken,
      googleRefreshToken: tokens.refreshToken,
    })
    .onConflictDoUpdate({
      target: schema.users.googleId,
      set: {
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        googleAccessToken: tokens.accessToken,
        googleRefreshToken: tokens.refreshToken,
      },
    })
    .returning();

  return user;
}

export async function createSession(db: DbClient, userId: string) {
  const sessionToken = nanoid(); // Use nanoid for a URL-friendly session token
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days from now

  await db.insert(schema.sessions).values({
    id: sessionToken,
    userId: userId,
    expiresAt: expiresAt,
  });

  return sessionToken;
}