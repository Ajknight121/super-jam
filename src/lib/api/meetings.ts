import type {
  APIMeeting,
  MeetingAvailability,
  RegisterResponse,
  UserAvailability,
} from "#/src/api-types-and-schemas";
import {
  APIMeetingSchema,
  LoginRequestSchema,
  MeetingAvailabilitySchema,
  UserAvailabilitySchema,
} from "#/src/api-types-and-schemas";
import { handleApiResponse } from "./index";

// Get a meeting by id
export async function getMeeting(meetingId: string): Promise<APIMeeting> {
  const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}`);
  return handleApiResponse(res, (json) => APIMeetingSchema.parse(json));
}

// Create a meeting - stub
export async function createMeeting(
  meeting: Partial<APIMeeting>,
): Promise<{ id: string }> {
  const res = await fetch(`/api/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meeting),
  });

  return handleApiResponse(res);
}

// Get availability for a meeting (all users)
export async function getMeetingAvailability(
  meetingId: string,
): Promise<MeetingAvailability> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/availability`,
  );
  return handleApiResponse(res, (json) =>
    MeetingAvailabilitySchema.parse(json),
  );
}

// Get a single user's availability for a meeting
export async function getUserAvailability(
  meetingId: string,
  userId: string,
): Promise<UserAvailability> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/availability/${encodeURIComponent(userId)}`,
  );
  return handleApiResponse(res, (json) => UserAvailabilitySchema.parse(json));
}

// Set a user's availability for a meeting
export async function setUserAvailability(
  meetingId: string,
  userId: string,
  availability: UserAvailability,
): Promise<void> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/availability/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(availability),
    },
  );
  await handleApiResponse(res);
}

// Log in a user for a meeting
export async function loginUser(
  meetingId: string,
  memberId: string,
  password: string,
): Promise<void> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, password }),
    },
  );
  await handleApiResponse(res);
}

// Register a new user for a meeting
export async function registerUser(
  meetingId: string,
  username: string,
  password: string,
): Promise<RegisterResponse> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
  );

  return handleApiResponse(res);
}
// Get or set a meeting name
// name endpoint currently unimplemented - adjust when implemented
export async function getMeetingName(meetingId: string): Promise<string> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/name`,
  );
  return handleApiResponse(res);
}

export async function setMeetingName(
  meetingId: string,
  name: string,
): Promise<void> {
  const res = await fetch(
    `/api/meetings/${encodeURIComponent(meetingId)}/name`,
    {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: name,
    },
  );

  await handleApiResponse(res);
}
