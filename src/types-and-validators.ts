// Types and Zod schemas for things shared frontend and backend.
// Not all of the validation logic is here! Some is too complicated to be easily expressed in Zod (it would be voodoo IMO, though I do understand it). See https://chatgpt.com/s/t_690646e3ec608191bc1114d90d95e02a, especially paragraph 1, for how to do it. (I only read paragraph 1.)
import * as zod from "zod/mini";

// A helper for confirming that all the elements of an array of numbers or strings are unique.
const allUnique = (arr: (number | string)[]) => new Set(arr).size === arr.length;

const Time = zod.string().check(zod.iso.datetime({ offset: true, precision: 3 }));

const Times = zod.array(Time).check(zod.refine(allUnique));

// TODO: Fix with info about how to do ids. https://piazza.com/class/mdt3addszda1is/post/78
//
// This is a JSON array of the time-slots for which one user is available for one meeting.
// These time-slots are the beginnings of 15-minute chunks, for which the user is available.
//
// ```json
// [1762195500,1762196400,1762197300,1762198200,1762199100,1762200000,1762200900,1762201800]
// ```
export const UserAvailability = Times;
export type UserAvailability = zod.infer<typeof UserAvailability>;

// This is an object that stores everyone's availabilities for one meeting.
// It should look something like this:
// ```json
// {
//   "[userId1]" : [1762195500,1762196400,1762197300,1762198200,1762199100,1762200000,1762200900,1762201800],
//   "[userId2]" : [1762183800,1762184700,1762185600,1762186500,1762187400,1762188300,1762189200,1762190100,1762191000]
// }
// ```
// That's a map from user ids to their availabilities. The availabilities are arrays of unix timestamps, each one representing a 15-minute chunk for which that person is available.
//
// The order of the timestamps in the array is not significant, but we should endeavor to produce arrays with ascending timestamps. (an instance of the [Robustness Principle](https://en.wikipedia.org/wiki/Robustness_principle))
export const MeetingAvailability = zod.map(zod.uuid(), UserAvailability);
export type MeetingAvailability = zod.infer<typeof MeetingAvailability>;

const DayOfTheWeek = zod.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
export type DayOfTheWeek = zod.infer<typeof DayOfTheWeek>;

const AvailableDayConstraints = zod.discriminatedUnion("type", [
  zod.object({
    type: "specificDays",
    // The timestamps of the starts of the days, in UTC.
    days: Times,
  }),
  zod.object({
    type: "daysOfWeek",
    days: zod.array(DayOfTheWeek).check(zod.refine(allUnique)),
  }),
]);
export type AvailableDayConstraints = zod.infer<typeof AvailableDayConstraints>;

const TimeRange = zod.object({
  start: Time,
  end: Time,
});
export type TimeRange = zod.infer<typeof TimeRange>;

export const AvailabilityContraints = zod.object({
  availableDayConstraints: AvailableDayConstraints,
  timeRangeForEachDay: TimeRange,
});

export type AvailabilityContraints = zod.infer<typeof AvailabilityContraints>;

export const Meeting = zod.object({
  // Meeting names must be at least one character long.
  name: zod.string().check(zod.minLength(1)),
  availability: MeetingAvailability,
  availabilityBounds: AvailabilityContraints,
});
export type Meeting = zod.infer<typeof Meeting>;
