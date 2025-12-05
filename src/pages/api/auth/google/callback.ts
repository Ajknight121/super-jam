// src/pages/api/auth/google/callback.ts
import type { APIRoute } from "astro";
import { google } from "../../../../lib/oauth.ts";
import { drizzle } from "drizzle-orm/d1";
import { findOrCreateUser, createSession } from "../../../../lib/db.ts";

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies, url, redirect }) => {
  console.log("auth-callback")
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies.get("google_oauth_state")?.value;
  const storedCodeVerifier = cookies.get("google_code_verifier")?.value;

  if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    
    // Use the Access Token to get User Info
    const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const googleUser = await googleUserResponse.json();

    const db = drizzle(locals.runtime.env.DB);

    // 1. Find or create the user and update their tokens
    const user = await findOrCreateUser(db, googleUser, {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
    });

    // 2. Create a secure session for the user
    const sessionToken = await createSession(db, user.id);

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