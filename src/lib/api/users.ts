import type { User } from "#/src/api-types-and-schemas";
import { handleApiResponse } from "./index";

export async function createUser(
  defaultName: string,
): Promise<{ id: string; defaultName: string }> {
  const res = await fetch(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaultName: defaultName } satisfies User),
  });

  return await handleApiResponse(res);
}

export async function getUser(userId: string): Promise<User> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  return handleApiResponse(res);
}
