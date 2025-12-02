import type { User } from "#/src/api-types-and-schemas";
import { handleApiResponse } from "./index";

export async function createUser(
  defaultName: string,
): Promise<{ id: string; defaultName: string } | undefined> {
  const res = await fetch(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaultName: defaultName } satisfies User),
  });

  if (res.ok && res.status === 201) {
    const location = res.headers.get("Location");
    if (location) {
      const id = location.substring(location.lastIndexOf("/") + 1);
      const body = (await res.json()) as User;
      return { id: id, defaultName: body.defaultName };
    }
  }

  // Fallback
  return await handleApiResponse(res);
}

export async function getUser(userId: string): Promise<User | undefined> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  return handleApiResponse(res);
}
