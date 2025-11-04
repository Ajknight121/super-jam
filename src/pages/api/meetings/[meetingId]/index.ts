// TODO: For MVP.
// This should be a `Meeting` (see `src/types-and-validators.ts`).

import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { meetings } from "#/src/db/schema";

export const prerender = false;

export const GET = async ({ params, locals }: APIContext) => {
  const db = drizzle(locals.runtime.env.DB);

  const _result = await db.select().from(meetings).all();
  return Response.json(params.meetingId);
};
