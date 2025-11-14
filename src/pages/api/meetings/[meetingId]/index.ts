// TODO: For MVP.
// This should be a `Meeting` (see `src/types-and-validators.ts`).

import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { meetings } from "#/src/db/schema";

export const prerender = false;

export const GET = async ({ params, locals }: APIContext) => {
  const db = drizzle(locals.runtime.env.DB);
  if (params.meetingId === undefined) {
    // TODO(samuel-skean): Under what conditions can this be triggered?
    return Response.json(
      { customMakemeetError: "Malformed meeting URL." },
      { status: 404 },
    );
  }

  const dbResult = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, params.meetingId));

  assert(dbResult.length <= 1);

  if (dbResult.length === 0) {
    return Response.json(
      { customMakemeetError: "No such meeting." },
      { status: 404 },
    );
  }

  return Response.json(JSON.parse(dbResult[0].jsonData));
};
