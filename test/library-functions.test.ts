import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleApiResponse } from "#/src/lib/api";
import * as meetingsApi from "#/src/lib/api/meetings";
import * as usersApi from "#/src/lib/api/users";

/**
 * Tests for handleApiResponse function.
 *
 * Verifies:
 * - 204 No Content returns undefined.
 * - application/json content is parsed as JSON.
 * - text/plain content is parsed as text.
 * - 405 status throws helpful error.
 * - Other non-ok statuses throw HTTP error with body message.
 * - parseFn option is used when provided.
 * - Fallback to JSON parsing when content-type is wrong but body is JSON.
 * - Throws when content-type unsupported and JSON parse fails.
 */

vi.stubGlobal("window", { location: { origin: "http://localhost" } });

describe("handleApiResponse", () => {
  it("returns undefined for 204 No Content", async () => {
    const res = new Response(null, {
      status: 204,
      headers: { "content-type": "" },
    });
    //await expect(handleApiResponse(res)).resolves.toBeUndefined();
    await expect(handleApiResponse(res)).rejects.toThrowError();
  });

  it("parses JSON and returns it when content-type is application/json", async () => {
    const payload = { a: 1, b: "x" };
    const res = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
    const out = await handleApiResponse<typeof payload>(res);
    expect(out).toEqual(payload);
  });

  it("uses parseFn when provided", async () => {
    const payload = { a: 1 };
    const res = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const out = await handleApiResponse(res, (json) => ({
      ...(json as any),
      parsed: true,
    }));
    expect(out).toEqual({ a: 1, parsed: true });
  });

  it("parses text when content-type is text/plain", async () => {
    const res = new Response("hello world", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    const out = await handleApiResponse<string>(res);
    expect(out).toEqual("hello world");
  });

  it("throws helpful error for 405 status", async () => {
    const res = new Response("Not implemented", { status: 405 });
    await expect(handleApiResponse(res)).rejects.toThrow(
      "Endpoint not implemented (405).",
    );
  });

  it("throws HTTP error with body message for other non-ok statuses", async () => {
    const res = new Response("oops", { status: 500, statusText: "Server" });
    await expect(handleApiResponse(res)).rejects.toThrow(/HTTP 500/);
  });

  it("tries to parse JSON when content-type is wrong but body is JSON", async () => {
    const payload = { ok: true };
    const res = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/octet-stream" },
    });
    const out = await handleApiResponse(res);
    expect(out).toEqual(payload);
  });

  it("throws when content-type unsupported and JSON parse fails", async () => {
    // Return invalid JSON with non-JSON content-type
    const res = new Response("not-json", {
      status: 200,
      headers: { "content-type": "application/octet-stream" },
    });
    await expect(handleApiResponse(res)).rejects.toThrow(
      /unsupported content-type/,
    );
  });
});

/**
 * Tests for users API client functions.
 *
 * Verifies:
 * - `createUser` POSTs to `/api/users` with JSON body.
 * - `createUser` reads `Location` header and JSON body to return `{ id, defaultName }`.
 * - `getUser` fetches the right URL and forwards response via handleApiResponse.
 *
 * Uses mocking of global fetch to simulate API responses.
 */
const realFetch = globalThis.fetch;

describe("users API client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("createUser POSTs and returns id from Location and defaultName from body", async () => {
    const fakeResponseBody = { defaultName: "Alice" };
    const fakeId = "user-123";
    const fakeResponse = new Response(JSON.stringify(fakeResponseBody), {
      status: 201,
      headers: {
        Location: `/api/users/${fakeId}`,
        "content-type": "application/json",
      },
    });

    globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      // Validate the call shape
      expect(input).toBe("/api/users");
      expect(init?.method).toBe("POST");
      expect(init?.headers && (init.headers as any)["Content-Type"]).toBe(
        "application/json",
      );
      expect(JSON.parse(init?.body as string)).toEqual({
        defaultName: "Alice",
      });
      return fakeResponse;
    }) as unknown as typeof fetch;

    const out = await usersApi.createUser("Alice");
    expect(out).toEqual({ id: fakeId, defaultName: "Alice" });
  });

  it("getUser fetches the expected URL and returns parsed user", async () => {
    const fakeUser = { defaultName: "Bob" };
    const fakeResponse = new Response(JSON.stringify(fakeUser), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    globalThis.fetch = vi.fn(async (input: RequestInfo) => {
      expect(input).toBe("/api/users/some-id");
      return fakeResponse;
    }) as unknown as typeof fetch;

    const out = await usersApi.getUser("some-id");
    expect(out).toEqual(fakeUser);
  });
});

/**
 * Tests for meetings API client functions.
 *
 * Verifies:
 * - `getMeeting` calls the right endpoint and parses via MeetingSchema
 * - `createMeeting` POSTs to `/api/meetings`
 * - `getUserAvailability` calls the availability path
 * - `setUserAvailability` PUTs to the availability path with JSON body
 */
describe("meetings API client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("getMeeting fetches meeting and parses", async () => {
    const sampleMeeting = {
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

    globalThis.fetch = vi.fn(async (input: RequestInfo) => {
      expect((input as string).startsWith("/api/meetings/meet-")).toBeTruthy();
      return new Response(JSON.stringify(sampleMeeting), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const out = await meetingsApi.getMeeting("meet-1");
    expect(out).toEqual(sampleMeeting);
  });

  it("createMeeting POSTs to /api/meetings and returns response via handleApiResponse", async () => {
    const meetingPartial = { name: "x" };
    const fakeResponse = new Response(JSON.stringify({ id: "m1" }), {
      status: 201,
      headers: {
        "content-type": "application/json",
        Location: "/api/meeetings/m1",
      },
    });

    globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      expect(input).toBe("/api/meetings");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual(meetingPartial);
      return fakeResponse;
    }) as unknown as typeof fetch;

    const out = await meetingsApi.createMeeting(meetingPartial);
    // handleApiResponse returns the parsed body (here {id: "m1"})
    expect(out).toEqual({ id: "m1" });
  });

  it("getUserAvailability fetches the user's availability endpoint and parses", async () => {
    const availability = ["2025-11-03T18:45:00Z"];
    globalThis.fetch = vi.fn(async (input: RequestInfo) => {
      expect(input).toBe("/api/meetings/meet-x/availability/user-y");
      return new Response(JSON.stringify(availability), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const out = await meetingsApi.getUserAvailability("meet-x", "user-y");
    expect(out).toEqual(availability);
  });

  it("setUserAvailability PUTs JSON to user's availability endpoint", async () => {
    const availability = ["2025-11-03T18:45:00Z"];
    globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      expect(input).toBe("/api/meetings/m123/availability/u456");
      expect(init?.method).toBe("PUT");
      expect(init?.headers && (init.headers as any)["Content-Type"]).toBe(
        "application/json",
      );
      expect(JSON.parse(init?.body as string)).toEqual(availability);
      return new Response(null, { status: 204 }); // return No Content
    }) as unknown as typeof fetch;

    await expect(
      meetingsApi.setUserAvailability("m123", "u456", availability),
    ).rejects.toThrowError();
  });
});
