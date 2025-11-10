// Types and Zod schemas for things shared frontend and backend.
// Not all of the validation logic is here! Some is too complicated to be easily expressed in Zod (it would be voodoo IMO, though I do understand it). See https://chatgpt.com/s/t_690646e3ec608191bc1114d90d95e02a, especially paragraph 1, for how to do it. (I only read paragraph 1.)
import * as zod from "zod/mini";

// A helper for confirming that all the elements of an array of numbers or strings are unique.
const allUnique = (arr: (number | string)[]) =>
  new Set(arr).size === arr.length;

// All timestamps in the API are ISO-8601 timestamps with second precision, ending with "Z" (meaning they are UTC time).
const Time = zod
  .string()
  .check(zod.iso.datetime({ offset: false, local: false, precision: 0 }));

const Times = zod.array(Time).check(zod.refine(allUnique));

// It seems Kanich doesn't love this idea, but I (Skean) feel pretty strongly for it: https://piazza.com/class/mdt3addszda1is/post/78
//
// This is a JSON array of the time-slots for which one user is available for one meeting.
// These time-slots are the beginnings of 15-minute chunks, for which the user is available.
//
// ```json
// ["2025-11-03T18:45:00Z","2025-11-03T19:00:00Z","2025-11-03T19:15:00Z","2025-11-03T19:30:00Z","2025-11-03T19:45:00Z","2025-11-03T20:00:00Z","2025-11-03T20:15:00Z","2025-11-03T20:30:00Z"]
// ```
export const UserAvailability = Times;
export type UserAvailability = zod.infer<typeof UserAvailability>;

// This is an object that stores everyone's availabilities for one meeting.
// It should look something like this:
// ```json
// {
//   "[userId1]" : ["2025-11-03T18:45:00Z", "2025-11-03T19:00:00Z","2025-11-03T19:15:00Z","2025-11-03T19:30:00Z","2025-11-03T19:45:00Z","2025-11-03T20:00:00Z","2025-11-03T20:15:00Z","2025-11-03T20:30:00Z"],
//   "[userId2]" : ["2025-11-03T18:45:00Z","2025-11-03T19:00:00Z","2025-11-03T19:15:00Z","2025-11-03T19:30:00Z","2025-11-03T19:45:00Z","2025-11-03T20:00:00Z","2025-11-03T20:15:00Z","2025-11-03T20:30:00Z"]
// }
// ```
// That's a map from user ids to their availabilities. The availabilities are arrays of timestamps, each one representing a 15-minute chunk for which that person is available.
//
// The order of the timestamps in the array is not significant, but we should endeavor to produce arrays with ascending timestamps. (an instance of the [Robustness Principle](https://en.wikipedia.org/wiki/Robustness_principle))
export const MeetingAvailability = zod.record(zod.nanoid(), UserAvailability);
export type MeetingAvailability = zod.infer<typeof MeetingAvailability>;

const DayOfTheWeek = zod.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type DayOfTheWeek = zod.infer<typeof DayOfTheWeek>;

const AvailableDayConstraints = zod.discriminatedUnion("type", [
  zod.object({
    type: zod.literal("specificDays"),
    // The timestamps of the starts of the days, in UTC.
    days: Times,
  }),
  zod.object({
    type: zod.literal("daysOfWeek"),
    // TODO: Must all be on Jan 1st, 1970.
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

export const IanaTimezone = zod.string().check(
  zod.refine(
    (val) => {
      // STRETCH: Support other locales.
      try {
        new Intl.DateTimeFormat("en-us", { timeZone: val });
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "invalid time zone",
    },
  ),
);

export const Meeting = zod.object({
  // Meeting names must be at least one character long.
  name: zod.string().check(zod.minLength(1)),
  availability: MeetingAvailability,
  availabilityBounds: AvailabilityContraints,
  timeZone: IanaTimezone,
});
export type Meeting = zod.infer<typeof Meeting>;

export const User = zod.object({
  defaultName: zod.string().check(zod.minLength(1)),
  // STRETCH: Support different names for each meeting. This may be the most sensitive data we deal with, honestly!
});
export type User = zod.infer<typeof User>;
