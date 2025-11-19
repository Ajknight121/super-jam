import assert from "node:assert";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { MakemeetError, User } from "#/src/api-types-and-schemas";
import { users } from "#/src/db/schema";

// The properties of a user, including their name.
export const prerender = false;

// TODO: For MVP.
export const GET = async ({ locals, params }: APIContext) => {
  if (params.userId === undefined) {
    // TODO(samuel-skean): Under what conditions can this be triggered?
    return Response.json(
      {
        customMakemeetError: "Malformed user availability URL.",
      } satisfies MakemeetError,
      { status: 404 },
    );
  }

  const db = drizzle(locals.runtime.env.DB);

  const dbResult: User[] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId));

  assert(dbResult.length <= 1);

  if (dbResult.length === 0) {
    return Response.json(
      { customMakemeetError: "No such user." } satisfies MakemeetError,
      { status: 404 },
    );
  }

  return Response.json({ defaultName: dbResult[0].defaultName } satisfies User);
};
