// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";
import { drizzle } from "drizzle-orm/d1";
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
  validateSessionToken,
} from "./lib/session";

const authMiddleware = defineMiddleware(async (context, next) => {
  const token = context.cookies.get("session")?.value ?? null;
  if (token === null) {
    context.locals.session = null;
    context.locals.user = null;
    return next();
  }

  const db = drizzle(context.locals.runtime.env.DB);
  const { user, session } = await validateSessionToken(db, token);
  if (session) {
    // Session is valid, extend the cookie expiration
    setSessionTokenCookie(context, token, session.expiresAt);
  } else {
    // Session is invalid or expired, delete the cookie
    deleteSessionTokenCookie(context);
  }
  context.locals.session = session;
  context.locals.user = user;
  return next();
});

export const onRequest = sequence(authMiddleware);
