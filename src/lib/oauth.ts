// src/lib/oauth.ts
import { Google } from "arctic";

export const google = new Google(
  import.meta.env.GOOGLE_CLIENT_ID,
  import.meta.env.GOOGLE_CLIENT_SECRET,
  
  import.meta.env.DEV 
    ? "http://localhost:4321/api/auth/google/callback" 
    : "https://makemeet.cloudcs484-0.workers.dev/api/auth/google/callback"
);