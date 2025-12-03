import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Runtime } from "@astrojs/cloudflare";
import { getDb } from "./db";

const auth = betterAuth((runtime: Runtime) => ({
  database: drizzleAdapter(getDb(runtime), {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: runtime.env.GOOGLE_CLIENT_ID,
      clientSecret: runtime.env.GOOGLE_CLIENT_SECRET,
      scope: [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar",
      ],
    },
  },
}));

export default auth;
