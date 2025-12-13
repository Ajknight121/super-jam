// src/lib/session.ts
import type { APIContext } from "astro";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "#/src/db/schema";
import {
  deleteSession as dbDeleteSession,
  getSessionAndUser,
} from "#/src/lib/db";

type DbClient = DrizzleD1Database<typeof schema>;

/**
 * Validates a session token by checking it against the database.
 * @param db The Drizzle database client.
 * @param token The session token from the cookie.
 * @returns An object containing the user and session, or null if invalid.
 */
export async function validateSessionToken(db: DbClient, token: string) {
  const { user, session } = await getSessionAndUser(db, token);

  if (!session || !user) {
    return { user: null, session: null };
  }

  return { user, session };
}

/**
 * Invalidates a session by deleting it from the database.
 * @param db The Drizzle database client.
 * @param sessionId The ID of the session to invalidate.
 */
export async function invalidateSession(db: DbClient, sessionId: string) {
  await dbDeleteSession(db, sessionId);
}

/**
 * Sets the session token cookie on the response.
 * @param context The Astro API context.
 * @param token The session token to set.
 * @param expiresAt The expiration date for the cookie.
 */
export function setSessionTokenCookie(
  context: APIContext,
  token: string,
  expiresAt: Date,
) {
  context.cookies.set("session", token, {
    path: "/",
    expires: expiresAt,
    httpOnly: true,
    secure: import.meta.env.PROD,
  });
}

/**
 * Deletes the session token cookie.
 * @param context The Astro API context.
 */
export function deleteSessionTokenCookie(context: APIContext) {
  context.cookies.delete("session", { path: "/" });
}
