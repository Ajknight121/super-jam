import { handleJsonResponse } from "./index";
import type { Meeting as MeetingType, UserAvailability } from "#/src/types-and-validators";
import {
    Meeting as MeetingSchema,
    MeetingAvailability as MeetingAvailabilitySchema,
    UserAvailability as UserAvailabilitySchema
} from "#/src/types-and-validators";

// Convert plain object into a Map for zod.map parsing.
function parseMeetingAvailabilityObject(obj: any) {
    // obj should be an object whose keys are ids and values are arrays
    const entries = Object.entries(obj);
    const map = new Map<string, any>(entries);
    return MeetingAvailabilitySchema.parse(map);
}

// Get a meeting by id
export async function getMeeting(meetingId: string): Promise<MeetingType | undefined> {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}`);
    return handleJsonResponse(res, (json) => MeetingSchema.parse(json));
}

// Create a meeting - stub
export async function createMeeting(meeting: Partial<MeetingType>): Promise<{ id: string } | undefined> {
    const res = await fetch(`/api/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meeting)
    });

    return handleJsonResponse(res);
}

// Get availability for a meeting (all users)
export async function getMeetingAvailability(meetingId: string) {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/availability`);
    return handleJsonResponse(res, (json) => parseMeetingAvailabilityObject(json));
}

// Get a single user's availability for a meeting
export async function getUserAvailability(meetingId: string, userId: string): Promise<UserAvailability | undefined> {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/availability/${encodeURIComponent(userId)}`);
    return handleJsonResponse(res, (json) => UserAvailabilitySchema.parse(json));
}

// Set a user's availability for a meeting
export async function setUserAvailability(meetingId: string, userId: string, availability: UserAvailability): Promise<void | undefined> {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/availability/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availability)
    });
    await handleJsonResponse(res);
}

// Get or set a meeting name
// name endpoint currently unimplemented - adjust when implemented
export async function getMeetingName(meetingId: string): Promise<string | undefined> {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/name`);
    return handleJsonResponse(res);
}

export async function setMeetingName(meetingId: string, name: string): Promise<void | undefined> {
    const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}/name`, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: name
    });

    await handleJsonResponse(res);
}