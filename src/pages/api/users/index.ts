import assert from "node:assert";
import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import {
  jsonParseErrorResponse,
  type User,
  UserSchema,
  zodErrorResponse,
} from "#/src/api-types-and-schemas";
import { users } from "#/src/db/schema";

// TODO: For final project.
export const prerender = false;

// TODO: MVP.
// TODO: Create user.
export const POST = async ({ locals, request }: APIContext) => {
  let unvalidatedNewUser: unknown;

  try {
    unvalidatedNewUser = await request.json();
  } catch (e) {
    return jsonParseErrorResponse(e);
  }

  const newUserResult = UserSchema.safeParse(unvalidatedNewUser);

  if (newUserResult.error) {
    return zodErrorResponse(newUserResult.error);
  }

  const newUser = newUserResult.data;

  const db = drizzle(locals.runtime.env.DB);

  const dbResult = await db
    .insert(users)
    .values({ ...newUser, id: nanoid() })
    .returning();

  assert(dbResult.length === 1);

  return Response.json(
    { defaultName: dbResult[0].defaultName } satisfies User,
    {
      status: 201,
      headers: {
        Location: `/api/users/${encodeURIComponent(dbResult[0].id)}`,
      },
    },
  );
};
