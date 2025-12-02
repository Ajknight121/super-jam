import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleApiResponse } from "../src/lib/api";
import * as usersApi from "../src/lib/api/users";

/**
 * Tests for handleApiResponse function.
 *
 * Scenarios covered:
 * - 204 No Content
 * - application/json content-type
 * - text/plain content-type
 * - non-ok responses (405)
 * - fallback branch when content-type is incorrect but body is JSON
 */
describe("handleApiResponse", () => {
  it("returns undefined for 204 No Content", async () => {
    const res = new Response(null, {
      status: 204,
      headers: { "content-type": "" },
    });
    await expect(handleApiResponse(res)).resolves.toBeUndefined();
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
 * Intent:
 * - Ensure `createUser` POSTs to `/api/users` with JSON body.
 * - Ensure `createUser` reads `Location` header and JSON body to return `{ id, defaultName }`.
 * - Ensure `getUser` fetches the right URL and forwards response via handleApiResponse.
 *
 * Uses mocking of global fetch to simulate API responses.
 */

describe("users API client", () => {
  const realFetch = globalThis.fetch;

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
