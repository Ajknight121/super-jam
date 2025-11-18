import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  MeetingSchema,
  UserAvailabilitySchema,
} from "#/src/api-types-and-schemas";
import { meetings, users } from "#/src/db/schema";

// This should be a `UserAvailability` (see `src/types-and-validators.ts`) with [userId]'s availability for [meetingId].
export const prerender = false;

export const GET = () => {
  return new Response("Unimplemented", {
    status: 405,
  });
};

// TODO: For MVP.
export const PUT = async ({ params, locals, request }: APIContext) => {
  // TODO(samuel-skean): Remove the user's id as a key if the user's availability is set to empty.

  if (params.meetingId === undefined || params.userId === undefined) {
    // TODO(samuel-skean): Under what conditions can this be triggered?
    return Response.json(
      { customMakemeetError: "Malformed user availability URL." },
      { status: 404 },
    );
  }

  const newAvailabilityResult = UserAvailabilitySchema.safeParse(
    await request.json(),
  );

  if (newAvailabilityResult.error) {
    return Response.json(JSON.parse(newAvailabilityResult.error.message), {
      status: 400,
    });
  }

  const newAvailability = newAvailabilityResult.data;

  const db = drizzle(locals.runtime.env.DB);
  const userExistsDbResult = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId));

  assert(userExistsDbResult.length <= 1);

  if (userExistsDbResult.length === 0) {
    return Response.json(
      {
        // TODO(samuel-skean): Does this leak info that we don't want to leak? I don't think so.
        customMakemeetError: "No such user.",
      },
      { status: 404 },
    );
  }

  // STRETCH(samuel-skean): Do the following in one query, with sqlite's json_set. I decided against this because it involves constructing part of the template string with user data, at least according to the end of [this ChatGPT chat](https://chatgpt.com/share/691bcbe4-3ddc-8006-bd57-5ad200690ea9). That's one of the classic blunders!

  const initialMeetingDbResult = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, params.meetingId));

  assert(initialMeetingDbResult.length <= 1);

  if (initialMeetingDbResult.length === 0) {
    return Response.json(
      {
        customMakemeetError: "No such meeting.",
      },
      { status: 404 },
    );
  }

  const initialMeeting = MeetingSchema.parse(
    JSON.parse(initialMeetingDbResult[0].jsonData),
  );
  const { availability: initialMeetingAvailability } = initialMeeting;

  const newMeeting = {
    ...initialMeeting,
    availability: {
      ...initialMeetingAvailability,
      [params.userId]: newAvailability,
    },
  };

  // Just in case the database contains a user that doesn't have a nanoid, this'll catch that. It may catch other things too... best to find them in dev!
  MeetingSchema.parse(newMeeting);

  const newMeetingUpdateDbResult = await db
    .update(meetings)
    .set({ jsonData: JSON.stringify(newMeeting) })
    .where(eq(meetings.id, params.meetingId))
    .returning();

  // If this fails, we updated too many rows!
  assert(newMeetingUpdateDbResult.length === 1);

  let responseInit: ResponseInit;
  if (params.userId in initialMeeting.availability) {
    console.log("hi");
    responseInit = {
      status: 200,
    };
  } else {
    responseInit = {
      status: 201,
      headers: {
        Location: new URL(request.url).pathname,
      },
    };
  }

  return Response.json(
    MeetingSchema.parse(JSON.parse(newMeetingUpdateDbResult[0].jsonData))
      .availability[params.userId],
    responseInit,
  );
};
