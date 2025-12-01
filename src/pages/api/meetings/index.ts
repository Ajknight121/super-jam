import assert from "node:assert";
import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import {
  APIMeetingSchema,
  jsonParseErrorResponse,
  type MakemeetError,
  zodErrorResponse,
} from "#/src/api-types-and-schemas";
import { meetings } from "#/src/db/schema";

// TODO: For MVP.
export const prerender = false;

export const POST = async ({
  locals,
  request,
}: APIContext): Promise<Response> => {
  const db = drizzle(locals.runtime.env.DB);

  let unvalidatedMeeting: unknown;
  try {
    unvalidatedMeeting = await request.json();
  } catch (e) {
    return jsonParseErrorResponse(e);
  }

  const meetingResult = APIMeetingSchema.safeParse(unvalidatedMeeting);

  if (meetingResult.error) {
    return zodErrorResponse(meetingResult.error);
  }
  const meeting = meetingResult.data;

  if (
    Object.keys(meeting.availability).length !== 0 ||
    meeting.members.length !== 0
  ) {
    return Response.json(
      {
        customMakemeetErrorMessage:
          "Cannot specify availability or members when creating meeting. Also, this error message will change.",
      } satisfies MakemeetError,
      {
        status: 400,
      },
    );
  }

  const dbResult = await db
    .insert(meetings)
    .values([{ id: nanoid(), jsonData: JSON.stringify(meeting) }])
    .returning();

  assert(dbResult.length === 1);

  return Response.json(
    { id: dbResult[0].id },
    {
      status: 201,
      headers: {
        Location: `/api/meetings/${encodeURIComponent(dbResult[0].id)}`,
      },
    },
  );
};
