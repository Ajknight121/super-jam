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
// export async function findOrCreateUser(
//   db: DbClient,
//   googleUser: { sub: string; email: string; name: string; picture: string },
//   tokens: { accessToken: string; refreshToken: string | null }
// ) {
//   const [user] = await db
//     .insert(schema.users)
//     .values({
//       id: nanoid(), // Generate a unique ID for our system
//       googleId: googleUser.sub,
//       email: googleUser.email,
//       name: googleUser.name,
//       avatarUrl: googleUser.picture,
//       googleAccessToken: tokens.accessToken,
//       googleRefreshToken: tokens.refreshToken,
//     })
//     .onConflictDoUpdate({
//       target: schema.users.googleId,
//       set: {
//         email: googleUser.email,
//         name: googleUser.name,
//         avatarUrl: googleUser.picture,
//         googleAccessToken: tokens.accessToken,
//         googleRefreshToken: tokens.refreshToken,
//       },
//     })
//     .returning();

//   return user;
// }

/**
 * Finds a user by their Google ID.
 * @param db The Drizzle database client.
 * @param googleId The user's Google ID.
 * @returns The user record from the database, or null if not found.
 */
export async function getUserFromGoogleId(db: DbClient, googleId: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.googleId, googleId));
  return user || null;
}

/**
 * Creates a new user in the database.
 * @param db The Drizzle database client.
 * @param data The user's data.
 * @returns The newly created user record from the database.
 */
export async function createUser(
  db: DbClient,
  data: {
    googleId: string;
    name: string;
    email: string;
    googleAccessToken: string;
    googleRefreshToken: string | null;
  }
) {
  const [user] = await db
    .insert(schema.users)
    .values({
      id: nanoid(),
      ...data,
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

/**
 * Deletes a session from the database.
 * @param db The Drizzle database client.
 * @param sessionId The ID of the session to delete.
 */
export async function deleteSession(db: DbClient, sessionId: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
}

/**
 * Retrieves a session and the associated user from the database.
 * @param db The Drizzle database client.
 * @param sessionToken The session token to look up.
 * @returns An object containing the user and session, or nulls if not found or expired.
 */
export async function getSessionAndUser(db: DbClient, sessionToken: string) {
  const result = await db
    .select({
      user: schema.users,
      session: schema.sessions,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, sessionToken));

  if (result.length === 0) {
    return { user: null, session: null };
  }

  const { user, session } = result[0];

  // Return nulls if the session is expired
  return session.expiresAt < new Date() ? { user: null, session: null } : { user, session };
}