import { useEffect, useState } from "react";
import { getMeeting, setUserAvailability } from "../lib/api/meetings";
import type { Meeting, MeetingAvailability, UserAvailability } from "#/src/api-types-and-schemas";

import "./AvailabilityChart.css";
import { Root as DragSelect, InputCell } from "./DragSelect";

/**
 * Calculates the number of 15-minute slots between a start and end time.
 * @param start - The start time in "HH:mm" format.
 * @param end - The end time in "HH:mm" format.
 * @returns The total number of 15-minute slots.
 */
function calculateTimeSlots(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMillis = endDate.getTime() - startDate.getTime();
  return diffMillis / (15 * 60 * 1000); // 15 minutes in milliseconds
}

function getGradientColor(ratio: number) {
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const value = clamp(ratio * 100, 0, 100);

  const start = { r: 237, g: 243, b: 252 };
  const end = { r: 0, g: 74, b: 187 };

  const r = Math.round(start.r + (end.r - start.r) * (value / 100));
  const g = Math.round(start.g + (end.g - start.g) * (value / 100));
  const b = Math.round(start.b + (end.b - start.b) * (value / 100));
  return `rgb(${r},${g},${b})`;
}

const maxSegments = 5;

export interface UtcObject {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function utcObj(utc: string): UtcObject {
  const date = new Date(utc);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // getUTCMonth() is 0-indexed
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds(),
  };
}

export function objToUtc(obj: UtcObject): string {
  const date = new Date(
    Date.UTC(obj.year, obj.month - 1, obj.day, obj.hours, obj.minutes, obj.seconds)
  );
  // Ensure the format is YYYY-MM-DDTHH:mm:ssZ without milliseconds
  return date.toISOString().split(".")[0] + "Z";
}

export default function AvailabilityChart({ meetingId, userId }) {
  const [meeting, setMeeting] = useState<Meeting | undefined>(undefined);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const colors = Array.from({ length: maxSegments }, (_, i) => {
    const ratio = maxSegments > 1 ? i / (maxSegments - 1) : 0;
    return getGradientColor(ratio);
  });

  const exampleMeeting: Meeting = {
    name: "Example Meeting (Failed to Load)",
    availability: {
      user1: [
        "1970-01-01T09:00:00Z",
        "",
        "1970-01-01T09:30:00Z",
        "1970-01-01T09:00:00Z",
        "",
        "",
        "1970-01-02T10:00:00Z",
        "1970-01-02T10:15:00Z",
      ],
      user2: [
        "1970-01-01T09:15:00Z",
        "1970-01-01T09:30:00Z",
        "1970-01-01T09:45:00Z",
        "1970-01-03T11:00:00Z",
        "1970-01-03T11:15:00Z",
      ],
      user3: [
        "1970-01-01T09:00:00Z",
        "1970-01-01T09:15:00Z",
        "1970-01-04T14:00:00Z",
        "1970-01-04T14:15:00Z",
        "1970-01-04T14:30:00Z",
      ],
      user4: ["1970-01-01T09:15:00Z", "1970-01-01T09:30:00Z", "1970-01-01T10:00:00Z"],
    },
    availabilityBounds: {
      timeRangeForEachDay: {
        start: "1970-01-01T09:00:00Z",
        end: "1970-01-01T17:00:00Z",
      },
      availableDayConstraints: {
        type: "daysOfWeek",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
    },
    timeZone: "America/Chicago",
  };
  const exampleMeeting2: Meeting = {
    name: "Example Meeting (Failed to Load)",
    availability: {
      user1: [
        "2025-01-01T09:00:00Z",
        "2025-01-01T09:00:00Z",
        "2025-01-01T09:30:00Z",
        "2025-01-02T10:00:00Z",
        "2025-01-02T10:15:00Z",
        "",
        "",
        "",
      ],
      user2: [
        "2025-01-01T09:15:00Z",
        "2025-01-01T09:30:00Z",
        "2025-01-01T09:45:00Z",
        "2025-01-03T11:00:00Z",
        "2025-01-03T11:15:00Z",
      ],
      user3: [
        "2025-01-01T09:00:00Z",
        "2025-01-01T09:15:00Z",
        "2025-01-04T14:00:00Z",
        "2025-01-04T14:15:00Z",
        "2025-01-04T14:30:00Z",
      ],
      user4: ["2025-01-01T09:15:00Z", "2025-01-01T09:30:00Z", "2025-01-01T10:00:00Z"],
    },
    availabilityBounds: {
      timeRangeForEachDay: {
        start: "2025-01-01T09:00:00Z",
        end: "2025-01-01T17:00:00Z",
      },
      availableDayConstraints: {
        type: "specificDays",
        days: [
          "2025-01-01T00:00:00Z",
          "2025-01-02T00:00:00Z",
          "2025-01-03T00:00:00Z",
          "2025-01-04T00:00:00Z",
        ],
      },
    },
    timeZone: "America/Chicago",
  };

  const getCurrentMeeting = async (meetingId) => {
    try {
      setError(null);
      const meetingData = await getMeeting(meetingId);
      setMeeting(meetingData);
      // Initialize selected items from fetched availability
      const initialAvailability: string[] = meetingData.availability[userId] ?? [];
      setSelectedItems(
        initialAvailability.reduce((acc, time) => {
          // This needs to be more robust to handle different day representations
          // For now, we assume we can find the day for the given time.
          return { ...acc, [time]: true };
        }, {})
      );
    } catch (err) {
      setError(err);
      setMeeting(exampleMeeting2);
      // Initialize selected items from fetched availability
      const initialAvailability = exampleMeeting2.availability[userId] ?? [];
      console.log(userId, exampleMeeting2.availability[userId]);
      setSelectedItems(
        initialAvailability.reduce((acc, time) => {
          
          if (!time) return acc;
          // This needs to be more robust to handle different day representations
          // For now, we assume we can find the day for the given time.
          return { ...acc, [time]: true };
        }, {})
      );
    }
  };

  useEffect(() => {
    getCurrentMeeting(meetingId);
  }, [meetingId, userId]);

  const handleSelectionChange = async (items: Record<string, boolean>) => {
    setSelectedItems(items);
    const availability = Object.keys(items);
    console.log(availability);
    await setUserAvailability(meetingId, userId, availability);
    await getCurrentMeeting(meetingId);
  };

  // Don't render until the meeting has been loaded
  if (!meeting) {
    return <div className="availability-chart loading">Loading meeting...</div>;
  }

  // Now it's safe to destructure
  const { name, availability, availabilityBounds, timeZone } = meeting;

  const { timeRangeForEachDay, availableDayConstraints } = availabilityBounds;

  // Calculate availability counts for each time slot
  const availabilityCounts: Record<string, number> = {};
  Object.values(availability).forEach((userAvailability) => {
    userAvailability.forEach((time) => {
      availabilityCounts[time] = (availabilityCounts[time] || 0) + 1;
    });
  });

  const counts = Object.values(availabilityCounts);
  const maxAvailable = counts.length > 0 ? Math.max(...counts) : 0;
  const minAvailable = counts.length > 0 ? Math.min(...counts) : 0;

  const totalPeople = Object.keys(availability).length;

  const dayOffsets: { [key: string]: number } = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  // Generate an array representing the 15-minute time slots for a day
  const numberOfSlots = calculateTimeSlots(timeRangeForEachDay.start, timeRangeForEachDay.end);
  const startTime = new Date(timeRangeForEachDay.start);
  const timeSlots = Array.from({ length: numberOfSlots }, (_, i) => {
    const slotTime = new Date(startTime.getTime() + i * 15 * 60 * 1000);
    return `${slotTime.toISOString().split(".")[0]}Z`;
  });

  return (
    <div className="availability-chart">
      <div className="meeting-details">
        <div className="meeting-title">{name}</div>
        <div className="timezone">
          <div>Timezone: {timeZone}</div>
          {timeZone !== clientTimeZone && (
            <>
              <div>&gt;</div>
              <div>{clientTimeZone}</div>
            </>
          )}
        </div>
      </div>

      <div className="scale">
        <div className="label">
          {minAvailable}/{totalPeople}
        </div>
        <div className="scale-container">
          {colors.map((color) => (
            <div key={color} className="scale-segment" style={{ backgroundColor: color }}></div>
          ))}
        </div>
        <div className="label">
          {maxAvailable > 0 ? maxAvailable : totalPeople}/{totalPeople}
        </div>
      </div>

      <div className="display">
        <div className="availability-chart-days">
          {availabilityBounds.availableDayConstraints.type === "daysOfWeek"
            ? availabilityBounds.availableDayConstraints.days.map((day, index) => (
                <div key={day} className="availability-chart-day">
                  <div className="day-name">{day}</div>
                </div>
              ))
            : availabilityBounds.availableDayConstraints.days.map((day) => {
                const date = new Date(day);
                const formattedDate = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                });
                return (
                  <div key={day} className="availability-chart-day">
                    <div className="day-name">{formattedDate}</div>
                  </div>
                );
              })}
        </div>
        {isEditing ? (
          <DragSelect onSelectionChange={handleSelectionChange} initialItems={selectedItems}>
            <div className="availability-chart-grid">
              {availableDayConstraints.days.map((day, dayIndex) => (
                <div key={day} className="availability-chart-grid-day">
                  {timeSlots.map((time) => {
                    let adjustedTime = time;
                    if (availableDayConstraints.type === "daysOfWeek") {
                      const offset = dayOffsets[day.toLowerCase()] ?? 0;
                      const date = new Date(time);
                      date.setUTCDate(date.getUTCDate() + offset);
                      adjustedTime = date.toISOString().split(".")[0] + "Z";
                    } else if (availableDayConstraints.type === "specificDays") {
                      const slotDate = new Date(time);
                      const dayDate = new Date(day);
                      dayDate.setUTCHours(slotDate.getUTCHours(), slotDate.getUTCMinutes(), slotDate.getUTCSeconds());
                      adjustedTime = dayDate.toISOString().split(".")[0] + "Z";
                    }
                    
                    return (
                      <InputCell
                        key={adjustedTime}
                        timeId={adjustedTime}
                        color={""}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </DragSelect>
        ) : (
          <div className="availability-chart-grid view-only">
            {availableDayConstraints.days.map((day, dayIndex) => (
              <div key={day} className="availability-chart-grid-day">
                {timeSlots.map((time, index) => {
                  let adjustedTime = time;
                  if (availableDayConstraints.type === "daysOfWeek") {
                    const offset = dayOffsets[day.toLowerCase()] ?? 0;
                    const date = new Date(time);
                    date.setUTCDate(date.getUTCDate() + offset);
                    adjustedTime = date.toISOString().split(".")[0] + "Z";
                  } else if (availableDayConstraints.type === "specificDays") {
                    const slotDate = new Date(time);
                    const dayDate = new Date(day);
                    dayDate.setUTCHours(slotDate.getUTCHours(), slotDate.getUTCMinutes(), slotDate.getUTCSeconds());
                    adjustedTime = dayDate.toISOString().split(".")[0] + "Z";
                  }
                  const count = availabilityCounts[adjustedTime] || 0;
                  const ratio = maxAvailable > 0 ? count / maxAvailable : 0;
                  const color = getGradientColor(ratio);
                  return (
                    <InputCell
                      key={adjustedTime}
                      timeId={adjustedTime}
                      color={color}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="controls">
        {userId ? (
          <button type="button" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "View All Availability" : "Edit My Availability"}
          </button>
        ) : (
          <div>Sign in to add availability</div>
        )}
      </div>
    </div>
  );
}
