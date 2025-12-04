import { drizzle } from "drizzle-orm/d1";
import type { Runtime } from "@astrojs/cloudflare";

export function getDb(runtime: Runtime) {
  return drizzle(runtime.env.DB as D1Database);
}