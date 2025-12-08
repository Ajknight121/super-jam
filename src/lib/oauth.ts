// src/lib/oauth.ts
import { Google } from "arctic";

const callbackPath = "/api/auth/google/callback";

const GOOGLE_CALLBACK_URL =
  import.meta.env.DEV === true
    ? `http://localhost:4321${callbackPath}`
    : `${import.meta.env.PROD_URL}${callbackPath}`;

export const google = new Google(
  import.meta.env.GOOGLE_CLIENT_ID,
  import.meta.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);