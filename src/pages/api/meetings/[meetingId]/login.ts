import assert from "node:assert";
import type { APIContext } from "astro";
import { compare } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  DatabaseMeetingSchema,
  incorrectPasswordResponse,
  jsonParseErrorResponse,
  LoginRequestSchema,
  type LoginResponse,
  noSuchMeetingResponse,
  noSuchUserResponse,
  undefinedInRequiredURLParamResponse,
  unsupportedMethodResponse,
  zodErrorResponse,
} from "#/src/api-types-and-schemas";
import { meetings } from "#/src/db/schema";
import { setAuthCookie } from "#/src/lib/server_helpers";

export const prerender = false;

// TODO
export const POST = async ({
  params,
  locals,
  cookies,
  request,
}: APIContext) => {
  // TODO(samuel-skean): There's gotta be a way to factor this all out into middleware or something. Look for the END comment to see where the trivial stuff ends. Use middleware: https://docs.astro.build/en/guides/middleware/
  if (params.meetingId === undefined) {
    return undefinedInRequiredURLParamResponse();
  }

  let unvalidatedLoginRequest: unknown;
  try {
    unvalidatedLoginRequest = await request.json();
  } catch (e) {
    return jsonParseErrorResponse(e);
  }

  const loginRequestResult = LoginRequestSchema.safeParse(
    unvalidatedLoginRequest,
  );

  if (loginRequestResult.error) {
    return zodErrorResponse(loginRequestResult.error);
  }

  const loginRequestBody = loginRequestResult.data;
  // END of the thing that should be trivial to factor out.

  const db = drizzle(locals.runtime.env.DB);

  const meetingResult = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, params.meetingId));

  assert(meetingResult.length <= 1);

  if (meetingResult.length === 0) {
    return noSuchMeetingResponse();
  }

  // This line is erroring. Why? mfw when parse is so overloaded
  const meeting = DatabaseMeetingSchema.parse(
    JSON.parse(meetingResult[0].jsonData),
  );

  // TODO: Check if the cookie is already set, and yell at the client if it is, because if they're trying to login when they're already logged in, that's a bug in the client.

  const membersWithRequestedMemberId = meeting.members.filter(
    (member) => member.memberId === loginRequestBody.memberId,
  );

  // If we have multiple members with the same memberId on a meeting, we're screwed, so blow up. TODO: Validate this in the schema somehow.
  assert(membersWithRequestedMemberId.length <= 1);

  if (membersWithRequestedMemberId.length === 0) {
    return noSuchUserResponse();
  }

  const memberToAttemptLoginFor = membersWithRequestedMemberId[0];

  if (
    !(await compare(
      loginRequestBody.password,
      memberToAttemptLoginFor.hashedPassword,
    ))
  ) {
    return incorrectPasswordResponse();
  }

  // As of now, the user has successfully authenticated!

  setAuthCookie(cookies, params.meetingId, memberToAttemptLoginFor.authCookie);

  return new Response("" satisfies LoginResponse, { status: 200 });
};

export const GET = () => {
  return unsupportedMethodResponse("Try POST.");
};
