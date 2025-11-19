import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  noSuchUserResponse,
  type User,
  undefinedInRequiredURLParamResponse,
} from "#/src/api-types-and-schemas";
import { users } from "#/src/db/schema";

// The properties of a user, including their name.
export const prerender = false;

// TODO: For MVP.
export const GET = async ({ locals, params }: APIContext) => {
  if (params.userId === undefined) {
    return undefinedInRequiredURLParamResponse;
  }

  const db = drizzle(locals.runtime.env.DB);

  const dbResult: User[] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId));

  assert(dbResult.length <= 1);

  if (dbResult.length === 0) {
    return noSuchUserResponse;
  }

  return Response.json({ defaultName: dbResult[0].defaultName } satisfies User);
};
