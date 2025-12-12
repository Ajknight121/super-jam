// TODO: For MVP.
// This should be a `Meeting` (see `src/api-types-and-schemas.ts`).

import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  APIMeetingSchema,
  noSuchMeetingResponse,
  undefinedInRequiredURLParamResponse,
} from "#/src/api-types-and-schemas";
import { meetings } from "#/src/db/schema";

export const GET = async ({
  params,
  locals,
}: APIContext): Promise<Response> => {
  if (params.meetingId === undefined) {
    return undefinedInRequiredURLParamResponse();
  }

  const db = drizzle(locals.runtime.env.DB);
  const dbResult = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, params.meetingId));

  assert(dbResult.length <= 1);

  if (dbResult.length === 0) {
    return noSuchMeetingResponse();
  }

  return Response.json(
    // This ensures we only send the APIMeetingSchema fields to the client, since APIMeetingSchema is a zod.object, and those strip off unknown fields from the parsed result. Here's the best source I could trivially find: https://zod.dev/json-schema?id=object-schemas
    APIMeetingSchema.parse(JSON.parse(dbResult[0].jsonData)),
  );
};
