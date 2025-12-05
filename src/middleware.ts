// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionCookie = context.cookies.get("session")?.value;
  console.log("middleware", sessionCookie)

  if (sessionCookie) {
    // VALIDATE SESSION HERE (e.g., check database/KV)
    // context.locals.user = await db.getUserFromSession(sessionCookie);
    
    // Mock user for example:
    context.locals.user = { 
      isLoggedIn: true, 
      name: "Google User" // In real app, fetch this from DB
    };
  } else {
    context.locals.user = null;
  }

  return next();
});