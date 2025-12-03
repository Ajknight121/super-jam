import { drizzle } from "drizzle-orm/d1";
import type { Runtime } from "@astrojs/cloudflare";

let db: ReturnType<typeof drizzle<Record<string, never>>>;

export function getDb(runtime: Runtime) {
  if (!db) {
    db = drizzle(runtime.env.DB as D1Database);
  }
  return db;
}