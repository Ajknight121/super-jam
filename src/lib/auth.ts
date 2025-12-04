import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema"

export const auth = (env: any) => {
  // Connect to D1
  // console.log(env)
  const db = drizzle(env.DB);
  
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    // Add this to trust the host on Cloudflare
    trustedOrigins: [
       "http://localhost:4321", 
       "https://makemeet.cloudcs484-0.workers.dev/"
    ] 
  });
};