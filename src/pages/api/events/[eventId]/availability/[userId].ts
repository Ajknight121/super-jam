// This should return a JSON array of the time-slots for which the user [userId] is available for the event [eventId].
// These time-slots are the beginnings of 15-minute chunks, for which the user is available.
//
// ```json
// [1762195500,1762196400,1762197300,1762198200,1762199100,1762200000,1762200900,1762201800]
// ```
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
