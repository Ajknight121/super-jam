// Types and Zod schemas for things shared frontend and backend.
import * as zod from "zod/mini";

// TODONOW: Fix with info about how to do ids.
export const SingleUserAvailability = zod.array(zod.int()); // TODO: Ascending!
export type SingleUserAvailability = zod.infer<typeof SingleUserAvailability>;

export const EventAvailability = zod.map(zod.string(), SingleUserAvailability);
export type EventAvailability = zod.infer<typeof EventAvailability>;

export const Event = zod.object({
  name: zod.string(),
  availability: EventAvailability,
});
export type Event = zod.infer<typeof Event>;
