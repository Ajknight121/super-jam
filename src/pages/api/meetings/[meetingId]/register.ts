import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import {
  AuthCookieSchema,
  type DatabaseMeeting,
  DatabaseMeetingSchema,
  jsonParseErrorResponse,
  MemberIdSchema,
  noSuchMeetingResponse,
  RegisterRequestSchema,
  type RegisterResponse,
  undefinedInRequiredURLParamResponse,
  unsupportedMethodResponse,
  userAlreadyExistsResponse,
  zodErrorResponse,
} from "#/src/api-types-and-schemas";
import { meetings } from "#/src/db/schema";
import { hashPassword, setAuthCookie } from "#/src/lib/server_helpers";

export const prerender = false;

// Also logs the user in with their new identity, if they were not logged in.
export const POST = async ({
  params,
  locals,
  cookies,
  request,
}: APIContext) => {
  // TODO: Create the user in the members object on the server-side. Set the cookie on the client side too.

  // TODO(samuel-skean): There's gotta be a way to factor this all out into middleware or something. Look for the END comment to see where the trivial stuff ends. Use middleware: https://docs.astro.build/en/guides/middleware/
  if (params.meetingId === undefined) {
    return undefinedInRequiredURLParamResponse();
  }

  let unvalidatedRegisterRequest: unknown;
  try {
    unvalidatedRegisterRequest = await request.json();
  } catch (e) {
    return jsonParseErrorResponse(e);
  }

  const registerRequestResult = RegisterRequestSchema.safeParse(
    unvalidatedRegisterRequest,
  );

  if (registerRequestResult.error) {
    return zodErrorResponse(registerRequestResult.error);
  }

  const registerRequestBody = registerRequestResult.data;
  // END of the thing that should be trivial to factor out.

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

  // TODO: Ensure a user with this name doesn't already exist by looking at the meeting.
  const { members: initialMembers } = initialMeeting;

  if (
    initialMembers.some(
      (member) => member.name === registerRequestBody.username,
    )
  ) {
    return userAlreadyExistsResponse();
  }

  const hashedPassword = await hashPassword(registerRequestBody.password);

  const memberId = MemberIdSchema.parse(nanoid());
  const authCookie = AuthCookieSchema.parse(nanoid());

  const newMeeting = DatabaseMeetingSchema.parse({
    ...initialMeeting,
    members: [
      ...initialMembers,
      {
        memberId: memberId,
        name: registerRequestBody.username,
        hashedPassword: hashedPassword,
        authCookie: authCookie,
      },
    ],
  } satisfies DatabaseMeeting);

  const newMeetingUpdateDbResult = await db
    .update(meetings)
    .set({ jsonData: JSON.stringify(newMeeting) })
    .where(eq(meetings.id, params.meetingId))
    .returning();

  // If this fails, we updated too many rows!
  assert(newMeetingUpdateDbResult.length === 1);

  setAuthCookie(cookies, params.meetingId, authCookie);

  return Response.json({
    memberId: memberId,
  } satisfies RegisterResponse);
};

export const GET = () => {
  return unsupportedMethodResponse("Try POST.");
};
