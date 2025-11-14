import assert from "node:assert";
import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { MeetingSchema } from "#/src/api-types-and-schemas";
import { meetings } from "#/src/db/schema";

// TODO: For final project.
export const prerender = false;

export const POST = async ({ locals, request }: APIContext) => {
  const db = drizzle(locals.runtime.env.DB);

  const meetingResult = MeetingSchema.safeParse(await request.json());
  // TODO: Ensure no availability is listed here. Too much of an authentication nightmare.

  if (meetingResult.error) {
    return Response.json(JSON.parse(meetingResult.error.message), {
      status: 400,
    });
  }
  const meeting = meetingResult.data;

  const dbResult = await db
    .insert(meetings)
    .values([{ id: nanoid(), jsonData: JSON.stringify(meeting) }])
    .returning();

  assert(dbResult.length === 1);

  return Response.json(JSON.parse(dbResult[0].jsonData), {
    status: 201,
    headers: {
      Location: `/api/meetings/${encodeURIComponent(dbResult[0].id)}`,
    },
  });
};
