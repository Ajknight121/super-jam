import assert from "node:assert";
import type { APIContext } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import { type User, UserSchema } from "#/src/api-types-and-schemas";
import { users } from "#/src/db/schema";

// TODO: For final project.
export const prerender = false;

// TODO: MVP.
// TODO: Create user.
export const POST = async ({ params, locals, request }: APIContext) => {
  const newUserResult = UserSchema.safeParse(await request.json());

  if (newUserResult.error) {
    return Response.json(JSON.parse(newUserResult.error.message), {
      status: 400,
    });
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
