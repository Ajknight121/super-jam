import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: Too lazy to figure out how to appropriately fix this, it's just the drizzle config.
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    // biome-ignore lint/style/noNonNullAssertion: Too lazy to figure out how to appropriately fix this, it's just the drizzle config.
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    // biome-ignore lint/style/noNonNullAssertion: Too lazy to figure out how to appropriately fix this, it's just the drizzle config.
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
