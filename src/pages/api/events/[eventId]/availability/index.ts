// Low priority.
// This should return a JSON object that stores everyone's availabilities for the event [eventId].
// It should look something like this:
// ```json
// {
//   "[userId1]" : [1762195500,1762196400,1762197300,1762198200,1762199100,1762200000,1762200900,1762201800],
//   "[userId2]" : [1762183800,1762184700,1762185600,1762186500,1762187400,1762188300,1762189200,1762190100,1762191000]
// }
// ```
// That's a map from user ids to their availabilities. The availabilities are arrays of unix timestamps in ascending order, each one representing a 15-minute chunk for which that person is available.
export const prerender = false;

export const GET = () => {
  return new Response("Unimplemented", {
    status: 405,
  });
};
