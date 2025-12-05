// src/pages/api/auth/google/index.ts
import type { APIRoute } from "astro";
import { generateState, generateCodeVerifier } from "arctic";
import { google } from "../../../../lib/oauth.ts";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, url: currentUrl }) => {
  console.log("auth-index")
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const meetingId = currentUrl.searchParams.get("meetingId");

  const url = await google.createAuthorizationURL(state, codeVerifier, ["profile", "email",'https://www.googleapis.com/auth/calendar.readonly']);

  // Store state/verifier in httpOnly cookies so we can verify them in the callback
  cookies.set("google_oauth_state", state, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  cookies.set("google_code_verifier", codeVerifier, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  if (meetingId) {
    cookies.set("post_auth_redirect_path", `/availability/${meetingId}`, {
      path: "/",
      secure: import.meta.env.PROD,
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: "lax",
    });
  }

  return redirect(url.toString());
};