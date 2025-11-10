import type { User } from "#/src/types-and-validators";
import { handleApiResponse } from "./index";

export async function createUser(
  name: string,
): Promise<{ id: string } | undefined> {
  const res = await fetch(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return handleApiResponse(res);
}

export async function getUser(userId: string): Promise<User | undefined> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  return handleApiResponse(res);
}
