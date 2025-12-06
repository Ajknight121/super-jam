/**
 * Tests for server endpoint:
 *  - `src/pages/api/meetings/[meetingId]/availability/[memberId].ts` (PUT to set a member's availability)
 *
 * Strategy:
 *  - Use the same mocking approach as `test/api-endpoints/meetings.test.ts`:
 *    - mock `drizzle-orm`'s `eq`
 *    - mock `drizzle-orm/d1` to provide `__setMockData` and a fake `drizzle`
 *  - Test positive case (member exists, meeting exists, availability added -> 201 when new)
 *  - Test negative cases:
 *    - invalid availability body -> 400 (zod)
 *    - member not found -> 404
 */

import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "#/src/lib/server_helpers.ts";

// Mock `drizzle-orm`'s `eq` function
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (left: unknown, right: unknown) => ({ left, right }),
  };
});


vi.mock("nanoid", () => {
  return {
    nanoid: () => "fixed-nanoid",
  };
});

vi.mock("drizzle-orm/d1", async () => {
  let store: {
    selectResults?: { meetings?: any[]; members?: any[] };
    insertReturning?: any[];
    updateReturning?: any[];
  } = {};

  const drizzle = (_dbHandle: unknown) => {
    return {
      select: () => ({
        from: (table: any) => ({
          where: (_cond: any) => {
            if (!store.selectResults) return [];
            try {
              if (table && "jsonData" in table) {
                return store.selectResults.meetings ?? [];
              }
              if (table && "defaultName" in table) {
                return store.selectResults.members ?? [];
              }
            } catch {}
            return [];
          },
        }),
      }),

      insert: (_table: any) => ({
        values: (_vals: any) => ({
          returning: async () => store.insertReturning ?? [],
        }),
      }),

      update: (_table: any) => ({
        set: (_obj: any) => ({
          where: (_cond: any) => ({
            returning: async () => store.updateReturning ?? [],
          }),
        }),
      }),
    };
  };

  return {
    drizzle,
    __setMockData: (data: typeof store) => {
      store = data ?? {};
    },
  };
});

// Import the mocked module statically (vi.mock is hoisted so this is our mock)
import * as mockD1 from "drizzle-orm/d1";
//import { hash } from "node:crypto";

function makeApiContext(opts: {
  params?: Record<string, string | undefined>;
  jsonBody?: unknown;
  url?: string;
  meetingIdForCookie?: string;
  authCookieValue?: string;
}) {
  const {
    params = {},
    jsonBody = undefined,
    url = "https://example.test/",
    meetingIdForCookie = params.meetingId ?? "test-meeting-id",
    authCookieValue = "test-cookie",
  } = opts;

  const request = {
    json: async () => jsonBody,
    url,
  } as unknown as Request;

  const cookies = {
    get: (name: string) => {
      const expected = `auth-cookie-for-meeting-${meetingIdForCookie}`;
      if (name === expected) {
        return { value: authCookieValue };
      }
      return undefined;
    },
  } as any;

  const context = {
    params,
    locals: {
      runtime: {
        env: { DB: {} },
      },
    },
    request,
    cookies,
  } as unknown as APIContext;

  return context;
}

describe("PUT /api/meetings/[meetingId]/availability/[memberId] (server handler)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // seed default empty DB for each test - cast to any for test helper
    (mockD1 as any).__setMockData({
      selectResults: { meetings: [], members: [] },
      insertReturning: [],
      updateReturning: [],
    });
  });

  it("Creates availability for existing member & meeting -> returns 201 and availability body", async () => {
    // existing member row
    const memberRow = { 
      id: "aaaaaaaaaaaaaaaaaaaaa", 
      defaultName: "Sam", 
      hashedPassword: await hashPassword("test-hash" as any),
      authCookie: "aaaaaaaaaaaaaaaaaaaaa" as any
    };

    // existing meeting without this member's availability
    const meeting = {
      name: "Weekly",
      availability: {}, // empty
      members: [{ 
        memberId: memberRow.id, 
        name: memberRow.defaultName,
        hashedPassword: memberRow.hashedPassword,
        authCookie: memberRow.authCookie 
      }],
      availabilityBounds: {
        availableDayConstraints: { type: "daysOfWeek", days: ["monday"] },
        timeRangeForEachDay: {
          start: "1970-01-01T09:00:00Z",
          end: "1970-01-01T10:00:00Z",
        },
      },
      timeZone: "UTC",
    };

    // The handler will parse request.json() into a MemberAvailability array
    const newAvailability = ["2025-11-03T18:45:00Z", "2025-11-03T19:00:00Z"];

    // When selecting members -> return the member row
    // When selecting meetings -> return the initial meeting row
    // When updating -> return meeting with availability updated (stringified jsonData)
    const updatedMeeting = {
      ...meeting,
      availability: {
        [memberRow.id]: newAvailability,
      },
    };

    (mockD1 as any).__setMockData({
      selectResults: {
        members: [memberRow],
        meetings: [{ jsonData: JSON.stringify(meeting) }],
      },
      updateReturning: [{ jsonData: JSON.stringify(updatedMeeting) }],
      insertReturning: [],
    });

    const context = makeApiContext({
      params: { meetingId: "m1", memberId: memberRow.id },
      jsonBody: newAvailability,
      url: "https://example.test/api/meetings/m1/availability/aaaaaaaaaaaaaaaaaaaaa",
      meetingIdForCookie: "m1",
      authCookieValue: memberRow.authCookie,
    });

    const { PUT } = await import(
      "#/src/pages/api/meetings/[meetingId]/availability/[memberId].ts"
    );

    const res = await PUT(context);
    // Because member wasn't previously present in initialMeeting.availability, endpoint returns 201
    expect(res.status).toBe(201);
    expect(res.headers.get("Location")).toBe(
      "/api/meetings/m1/availability/aaaaaaaaaaaaaaaaaaaaa",
    );

    const body = (await res.json()) as string[];
    expect(body).toEqual(newAvailability);
  });

  it("Invalid availability body returns 400 (zod error)", async () => {
    // Invalid availability: not an array of ISO timestamps
    const invalidAvailability = { not: "an array" };

    // Ensure member exists and meeting exists so validation is reached first and fails
    (mockD1 as any).__setMockData({
      selectResults: {
        members: [{ id: "u1", defaultName: "X" }],
        meetings: [
          {
            jsonData: JSON.stringify({
              name: "Meeting",
              availability: {},
              members: [{ memberId: "u1", name: "X" }],
              availabilityBounds: {
                availableDayConstraints: {
                  type: "daysOfWeek",
                  days: ["monday"],
                },
                timeRangeForEachDay: {
                  start: "1970-01-01T09:00:00Z",
                  end: "1970-01-01T10:00:00Z",
                },
              },
              timeZone: "UTC",
            }),
          },
        ],
      },
      updateReturning: [],
      insertReturning: [],
    });

    const context = makeApiContext({
      params: { meetingId: "m1", memberId: "u1" },
      jsonBody: invalidAvailability,
    });

    const { PUT } = await import(
      "#/src/pages/api/meetings/[meetingId]/availability/[memberId].ts"
    );

    const res = await PUT(context);
    expect(res.status).toBe(400);

    const body = (await res.json()) as any;
    expect(body).toHaveProperty("customMakemeetErrorMessage");
    expect(body.customMakemeetErrorMessage).toMatch(/Validation error/);
  });

  it("negative: member not found returns 404", async () => {
    // No member rows -> member does not exist
    (mockD1 as any).__setMockData({
      selectResults: {
        members: [], // empty -> triggers noSuchUserResponse
        meetings: [
          {
            jsonData: JSON.stringify({
              name: "Meeting",
              availability: {},
              members: [],
              availabilityBounds: {
                availableDayConstraints: {
                  type: "daysOfWeek",
                  days: ["monday"],
                },
                timeRangeForEachDay: {
                  start: "1970-01-01T09:00:00Z",
                  end: "1970-01-01T10:00:00Z",
                },
              },
              timeZone: "UTC",
            }),
          },
        ],
      },
      updateReturning: [],
      insertReturning: [],
    });

    const context = makeApiContext({
      params: { meetingId: "m1", memberId: "missing-user" },
      jsonBody: ["1970-01-01T09:00:00Z"],
    });

    const { PUT } = await import(
      "#/src/pages/api/meetings/[meetingId]/availability/[memberId].ts"
    );
    const res = await PUT(context);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.customMakemeetErrorMessage).toMatch(/No such user/);
  });
});
