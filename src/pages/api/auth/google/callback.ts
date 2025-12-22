// src/pages/api/auth/google/callback.ts

import { decodeIdToken } from "arctic";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { users } from "#/src/db/schema";
import {
  createSession,
  createUser,
  getUserFromGoogleId,
} from "#/src/lib/db.ts";
import { google } from "#/src/lib/oauth.ts";

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies, url, redirect }) => {
  console.log("auth-callback");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies.get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier = cookies.get("google_code_verifier")?.value ?? null;

  if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
    return new Response(null, { status: 400 });
  }

  if (state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    const claims = decodeIdToken(tokens.idToken());
    const googleUserId = claims.sub;
    const username = claims.name;
    const email = claims.email;

    // Use the Access Token to get User Info

    const db = drizzle(locals.runtime.env.DB);

    // 1. Find or create the user and update their tokens
    const existingUser = await getUserFromGoogleId(db, googleUserId);

    // 2. Create a secure session for the user
    let sessionToken: string;
    let user;
    if (existingUser) {
      console.log("existing")
      // Update the access token for the existing user
      await db
        .update(users)
        .set({
          googleAccessToken: tokens.accessToken(),
        })
        .where(eq(users.id, existingUser.id));
      sessionToken = await createSession(db, existingUser.id);
    } else {
      user = await createUser(db, {
        googleId: googleUserId,
        name: username,
        email: email,
        googleAccessToken: tokens.accessToken(),
      });
      sessionToken = await createSession(db, user.id);
    }

    // Set the session cookie
    cookies.set("session", sessionToken, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    const redirectPath = cookies.get("post_auth_redirect_path")?.value ?? "/";

    // Clean up the redirect cookie
    cookies.delete("post_auth_redirect_path", {
      path: "/",
    });

    return redirect(redirectPath);
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  }
};
