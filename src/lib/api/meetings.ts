import type {
  Meeting as MeetingType,
  UserAvailability,
} from "#/src/types-and-validators";
import {
  MeetingAvailability as MeetingAvailabilitySchema,
  Meeting as MeetingSchema,
  UserAvailability as UserAvailabilitySchema,
} from "#/src/types-and-validators";
import { handleApiResponse } from "./index";

// Get a meeting by id
export async function getMeeting(
  meetingId: string,
): Promise<MeetingType | undefined> {
  const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}`);
  return handleApiResponse(res, (json) => MeetingSchema.parse(json));
}

// Create a meeting - stub
export async function createMeeting(
  meeting: Partial<MeetingType>,
): Promise<{ id: string } | undefined> {
  const res = await fetch(`/api/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meeting),
  });

  return handleApiResponse(res);
}

// Get availability for a meeting (all users)
export async function getMeetingAvailability(meetingId: string) {
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
): Promise<UserAvailability | undefined> {
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

// Get or set a meeting name
// name endpoint currently unimplemented - adjust when implemented
export async function getMeetingName(
  meetingId: string,
): Promise<string | undefined> {
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
