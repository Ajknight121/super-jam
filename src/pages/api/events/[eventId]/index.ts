// TODO: For MVP.
// This should return an object like this:
// ```json
// {
//    "name" : "[humanReadableNameForEvent]"
//    "availability" : {
//      /* See the description of the object returned by `api/events/[eventId]/availability/` for the structure of this object. */
//    }
// }
// ```
export const prerender = false;

export const GET = () => {
  return new Response("Unimplemented", {
    status: 405,
  });
};
