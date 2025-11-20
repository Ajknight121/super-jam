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

export default function AvailabilityChart({ meetingId, userId }) {
  const [meeting, setMeeting] = useState<Meeting | undefined>(undefined);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const exampleMeeting: Meeting = {
    name: "Example Meeting (Failed to Load)",
    availability: {
      userAvailability: [],
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
    timeZone: "CST",
  };

  useEffect(() => {
    const getCurrentMeeting = async (meetingId) => {
      try {
        setError(null);
        const meetingData = await getMeeting(meetingId);
        setMeeting(meetingData);
        // Initialize selected items from fetched availability
        const initialAvailability =
          meetingData.availability.userAvailability.find((ua) => ua.userId === userId)
            ?.availability ?? [];
        setSelectedItems(initialAvailability.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
      } catch (err) {
        setError(err);
        setMeeting(exampleMeeting);
      }
    };

    getCurrentMeeting(meetingId);
  }, [meetingId, userId]);

  const handleSelectionChange = async (items: Record<string, boolean>) => {
    setSelectedItems(items);
    const availability = Object.keys(items).map(key => {
      const parts = key.split('-');
      return parts.slice(1).join('-');
    });
    console.log(availability)
    await setUserAvailability(meetingId, userId, availability);
  };

  // Don't render until the meeting has been loaded
  if (!meeting) {
    return <div className="availability-chart loading">Loading meeting...</div>;
  }

  // Now it's safe to destructure
  const { name, availability, availabilityBounds } = meeting;

  const { timeRangeForEachDay, availableDayConstraints } = availabilityBounds;

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
    return slotTime.toISOString().split('.')[0] + "Z";
  });

  return (
    <div className="availability-chart">
      <div className="availability-chart-days">
        {availabilityBounds.availableDayConstraints.type === "daysOfWeek"
          ? availabilityBounds.availableDayConstraints.days.map((day, index) => (
              <div key={day} className="availability-chart-day">
                <div className="day-name">{day}</div>
              </div>
            ))
          : availabilityBounds.availableDayConstraints.days.map((day, index) => (
              <div key={day} className="availability-chart-day">
                <div className="day-name">{day}</div>
                {/* <div className="date-short">{day}/{month}</div> */}
              </div>
            ))}
      </div>
      <DragSelect onSelectionChange={handleSelectionChange} initialItems={selectedItems}>
        <div className="availability-chart-grid">
          {availableDayConstraints.days.map((day) => (
            <div key={day} className="availability-chart-grid-day">
              {timeSlots.map((time) => {
                let adjustedTime = time;
                if (availableDayConstraints.type === "daysOfWeek") {
                  const offset = dayOffsets[day.toLowerCase()] ?? 0;
                  const date = new Date(time);
                  date.setUTCDate(date.getUTCDate() + offset);
                  adjustedTime = date.toISOString().split('.')[0] + "Z";
                }
                return (
                <InputCell
                  key={`${day}-${adjustedTime}`}
                  timeId={`${day}-${adjustedTime}`}
                />
              );
              })}
            </div>
          ))}
        </div>
      </DragSelect>
    </div>
  );
}