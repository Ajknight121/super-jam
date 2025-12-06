/**
 * Tests for server endpoints under:
 *  - `src/pages/api/meetings/index.ts` (POST to create meeting)
 *  - `src/pages/api/meetings/[meetingId]/index.ts` (GET meeting)
 *
 * Strategy:
 *  - Mock `drizzle-orm/d1` so endpoint code calls our fake DB.
 *  - Mock `drizzle-orm`'s `eq` to return a simple object representing the where-cond.
 *  - Mock `nanoid` to return predictable ids.
 *  - Use the mock module's `__setMockData` to seed per-test DB results.
 *  - Dynamically import the endpoint after seeding mocks to ensure the endpoints use our mocks.
 */

import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock `drizzle-orm`'s `eq` function
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (left: unknown, right: unknown) => ({ left, right }),
  };
});

// Mock `nanoid` to return a stable id for created resources.
vi.mock("nanoid", () => {
  return {
    nanoid: () => "fixed-nanoid",
  };
});

// Mock `drizzle-orm/d1` with a tiny mutable fake DB and a helper `__setMockData`.
// The mock exports:
//   - `drizzle`: function that returns a `db` object with the minimal methods used by handlers.
//   - `__setMockData`: function to seed query/return values per test.
vi.mock("drizzle-orm/d1", async () => {
  // The mock keeps an internal `store` that tests can replace via __setMockData.
  let store: {
    selectResults?: { meetings?: any[]; members?: any[] };
    insertReturning?: any[];
    updateReturning?: any[];
  } = {};

  const drizzle = (_dbHandle: unknown) => {
    return {
      // SELECT ... FROM(table).where(cond) -> returns pre-seeded arrays
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
            } catch {
              // Fallback to empty
            }
            return [];
          },
        }),
      }),

      // INSERT(table).values(...).returning()
      insert: (_table: any) => ({
        values: (_vals: any) => ({
          returning: async () => {
            return store.insertReturning ?? [];
          },
        }),
      }),

      // UPDATE(table).set(...).where(...).returning()
      update: (_table: any) => ({
        set: (_obj: any) => ({
          where: (_cond: any) => ({
            returning: async () => {
              return store.updateReturning ?? [];
            },
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

import * as mockD1 from "drizzle-orm/d1";

// Helper to build a minimal `APIContext` like the handlers expect.
function makeApiContext(opts: {
  params?: Record<string, string | undefined>;
  jsonBody?: unknown;
  url?: string;
}) {
  const {
    params = {},
    jsonBody = undefined,
    url = "https://example.test/",
  } = opts;
  const request = {
    json: async () => jsonBody,
    url,
    // For Location header computations the handlers use new URL(request.url).pathname
  } as unknown as Request;
  const context = {
    params,
    locals: {
      runtime: {
        // The endpoint calls drizzle(locals.runtime.env.DB). We pass any object.
        env: { DB: {} },
      },
    },
    request,
  } as unknown as APIContext;
  return context;
}

describe("POST /api/meetings (server handler)", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    // reset mock DB to defaults (no rows)
    (mockD1 as any).__setMockData({
      selectResults: { meetings: [], members: [] },
      insertReturning: [{ id: "fixed-nanoid" }],
      updateReturning: [],
    });
  });

  it("Creates meeting and returns 201 with Location header and id", async () => {
    const meeting = {
      name: "Team Sync",
      availability: {},
      members: [],
      availabilityBounds: {
        availableDayConstraints: { type: "daysOfWeek", days: ["monday"] },
        timeRangeForEachDay: {
          start: "1970-01-01T09:00:00Z",
          end: "1970-01-01T10:00:00Z",
        },
      },
      timeZone: "UTC",
    };

    // Ensure the mocked insert will return a single created id (already seeded in beforeEach)
    const context = makeApiContext({
      jsonBody: meeting,
      url: "https://test.server/api/meetings",
    });

    // Import the handler after mocks are prepared
    const { POST } = await import("#/src/pages/api/meetings/index.ts");

    const res = await POST(context);
    expect(res.status).toBe(201);

    // Location header should contain new id
    expect(res.headers.get("Location")).toBe("/api/meetings/fixed-nanoid");
    const body = (await res.json()) as { id: string };
    expect(body).toEqual({ id: "fixed-nanoid" });
  });

  it("Invalid meeting body returns 400 with zod error message", async () => {
    // Invalid: empty name and missing required fields -> should fail validation
    const invalidMeeting = { name: "" };

    const context = makeApiContext({ jsonBody: invalidMeeting });
    const { POST } = await import("#/src/pages/api/meetings/index.ts");

    const res = await POST(context);
    expect(res.status).toBe(400);

    // The zodErrorResponse uses `customMakemeetErrorMessage` and `validationError`
    const body = (await res.json()) as any;
    expect(body).toHaveProperty("customMakemeetErrorMessage");
    expect(body.customMakemeetErrorMessage).toMatch(/Validation error/);
    expect(body).toHaveProperty("validationError");
  });
});

describe("GET /api/meetings/[meetingId] (server handler)", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    (mockD1 as any).__setMockData({
      selectResults: { meetings: []/*, members: []*/ },
      insertReturning: [],
      updateReturning: [],
    });
  });

  it("Returns meeting when present", async () => {
    const sampleMeeting = {
      name: "Present Meeting",
      availability: {},
      members: [],
      availabilityBounds: {
        availableDayConstraints: { type: "daysOfWeek", days: ["tuesday"] },
        timeRangeForEachDay: {
          start: "1970-01-01T09:00:00Z",
          end: "1970-01-01T10:00:00Z",
        },
      },
      timeZone: "UTC",
    };

    // Seed DB select result for the meetings table
    (mockD1 as any).__setMockData({
      selectResults: {
        meetings: [{ jsonData: JSON.stringify(sampleMeeting) }],
        members: [],
      },
      insertReturning: [],
      updateReturning: [],
    });

    const context = makeApiContext({ params: { meetingId: "m-1" } });
    const { GET } = await import(
      "#/src/pages/api/meetings/[meetingId]/index.ts"
    );

    const res = await GET(context);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toEqual(sampleMeeting);
  });

  it("Missing params.meetingId returns 500 (undefinedInRequiredURLParamResponse)", async () => {
    const context = makeApiContext({ params: {} });
    const { GET } = await import(
      "#/src/pages/api/meetings/[meetingId]/index.ts"
    );

    const res = await GET(context);
    expect(res.status).toBe(500);
    const body = (await res.json()) as any;
    expect(body).toHaveProperty("customMakemeetErrorMessage");
  });

  it("Meeting not found returns 404", async () => {
    // Ensure no meeting rows
    (mockD1 as any).__setMockData({
      selectResults: { meetings: [], members: [] },
      insertReturning: [],
      updateReturning: [],
    });

    const context = makeApiContext({ params: { meetingId: "missing" } });
    const { GET } = await import(
      "#/src/pages/api/meetings/[meetingId]/index.ts"
    );

    const res = await GET(context);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.customMakemeetErrorMessage).toMatch(/No such meeting/);
  });
});
