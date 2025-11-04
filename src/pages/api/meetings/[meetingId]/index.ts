// TODO: For MVP.
// This should be a `Meeting` (see `src/types-and-validators.ts`).

import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { events } from "#/src/db/schema";

export const prerender = false;

export const GET = async ({ locals, request }: APIContext) => {
  const db = drizzle(locals.runtime.env.DB);
  const result = await db.select().from(events).all();
  return Response.json(result);
};
