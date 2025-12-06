import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  APIMeetingSchema,
  type DatabaseMeeting,
  DatabaseMeetingSchema,
  jsonParseErrorResponse,
  noSuchMeetingResponse,
  noSuchUserResponse,
  notAuthenticatedResponse as notAuthenticatedForThisMeetingResponse,
  notAuthorizedForThisAvailabilityUpdateResponse,
  UserAvailabilitySchema,
  undefinedInRequiredURLParamResponse,
  zodErrorResponse,
} from "#/src/api-types-and-schemas";
import { meetings } from "#/src/db/schema";
import { getAuthCookie } from "#/src/lib/server_helpers";

// This should be a `UserAvailability` (see `src/api-types-and-schemas.ts`) with [userId]'s availability for [meetingId].
export const prerender = false;

export const GET = () => {
  return new Response("Unimplemented", {
    status: 405,
  });
};

// TODO: For MVP.
export const PUT = async ({
  params,
  locals,
  cookies,
  request,
}: APIContext): Promise<Response> => {
  // TODO(samuel-skean): Remove the user's id as a key if the user's availability is set to empty.

  if (params.meetingId === undefined || params.memberId === undefined) {
    return undefinedInRequiredURLParamResponse();
  }

  let unvalidatedNewAvailability: unknown;
  try {
    unvalidatedNewAvailability = await request.json();
  } catch (e) {
    return jsonParseErrorResponse(e);
  }

  const newAvailabilityResult = UserAvailabilitySchema.safeParse(
    unvalidatedNewAvailability,
  );
  // TODO: Confirm, either here or in the schema, that the availability is within the bounds set for the meeting.

  if (newAvailabilityResult.error) {
    return zodErrorResponse(newAvailabilityResult.error);
  }

  const newAvailability = newAvailabilityResult.data;

  const db = drizzle(locals.runtime.env.DB);
  const initialMeetingDbResult = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, params.meetingId));
  assert(initialMeetingDbResult.length <= 1);

  if (initialMeetingDbResult.length === 0) {
    return noSuchMeetingResponse();
  }

  const initialMeeting = DatabaseMeetingSchema.parse(
    JSON.parse(initialMeetingDbResult[0].jsonData),
  );
  const membersWithRequestedMemberId = initialMeeting.members.filter(
    (member) => member.memberId === params.memberId,
  );

  // If we have more than one member with the same ID, we're screwed, and we should blow up.
  assert(membersWithRequestedMemberId.length <= 1);

  if (membersWithRequestedMemberId.length === 0) {
    return noSuchUserResponse();
  }

  const memberToAttemptUpdateOn = membersWithRequestedMemberId[0];

  // STRETCH(samuel-skean): Do the following in one query, with sqlite's json_set. I decided against this because it involves constructing part of the template string with user data, at least according to the end of [this ChatGPT chat](https://chatgpt.com/share/691bcbe4-3ddc-8006-bd57-5ad200690ea9). That's one of the classic blunders!

  // Check that the user is authorized and authenticated:

  const authCookieForThisMeeting = getAuthCookie(cookies, params.meetingId);

  if (authCookieForThisMeeting === undefined) {
    return notAuthenticatedForThisMeetingResponse();
  }

  if (authCookieForThisMeeting !== memberToAttemptUpdateOn.authCookie) {
    return notAuthorizedForThisAvailabilityUpdateResponse();
  }

  // As of now, the user is authenticated and authorized!

  const { availability: initialMeetingAvailability } = initialMeeting;

  // The `parse` here is necessary to sort the user ids and hide the order of insertion, but also allows additional transformations and dynamic checks on the meeting to be added to `api-types-and-schemas` with a minimum of fuss.
  const newMeeting = DatabaseMeetingSchema.parse({
    ...initialMeeting,
    availability: {
      ...initialMeetingAvailability,
      [params.memberId]: newAvailability,
    },
  } satisfies DatabaseMeeting);

  const newMeetingUpdateDbResult = await db
    .update(meetings)
    .set({ jsonData: JSON.stringify(newMeeting) })
    .where(eq(meetings.id, params.meetingId))
    .returning();

  // If this fails, we updated too many rows!
  assert(newMeetingUpdateDbResult.length === 1);

  let responseInit: ResponseInit;
  if (params.memberId in initialMeeting.availability) {
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
    // This ensures we only send the APIMeetingSchema fields to the client, since APIMeetingSchema is a zod.object, and those strip off unknown fields from the parsed result. Here's the best source I could trivially find: https://zod.dev/json-schema?id=object-schemas
    APIMeetingSchema.parse(JSON.parse(newMeetingUpdateDbResult[0].jsonData))
      .availability[params.memberId],
    responseInit,
  );
};
