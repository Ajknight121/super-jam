// src/lib/oauth.ts
import { Google } from "arctic";

export const google = new Google(
  import.meta.env.GOOGLE_CLIENT_ID,
  import.meta.env.GOOGLE_CLIENT_SECRET,
  import.meta.env.GOOGLE_CALLBACK_URL
);