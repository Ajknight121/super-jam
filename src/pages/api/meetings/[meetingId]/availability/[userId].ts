// This should be a `UserAvailability` (see `src/types-and-validators.ts`) with [userId]'s availability for [meetingId].
export const prerender = false;

export const GET = () => {
  return new Response("Unimplemented", {
    status: 405,
  });
};

// TODO: For MVP.
export const PUT = () => {
  return new Response("Unimplemented", { status: 405 });
};
