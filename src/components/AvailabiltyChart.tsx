import { useEffect, useState } from "react";
import { getMeeting } from "../lib/api/meetings";
import type {
  Meeting,
  MeetingAvailability,
  UserAvailability,
} from "#/src/api-types-and-schemas";

import "./AvailabilityChart.css"
import { Root, InputCell } from "./DragSelect";

/**
 * Calculates the number of 15-minute slots between a start and end time.
 * @param start - The start time in "HH:mm" format.
 * @param end - The end time in "HH:mm" format.
 * @returns The total number of 15-minute slots.
 */
function calculateTimeSlots(start: string, end: string): number {
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const totalStartMinutes = startHours * 60 + startMinutes;
  const totalEndMinutes = endHours * 60 + endMinutes;
  return (totalEndMinutes - totalStartMinutes) / 15;
}

export default function AvailabilityChart({meetingId}) {
  const [meeting, setMeeting] = useState<Meeting | undefined>(undefined);
  const [error, setError] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]); // TODO set to user's fetched availability

  const exampleMeeting: Meeting = {
    name: "Example Meeting (Failed to Load)",
    availability: {
      userAvailability: [],
    },
    availabilityBounds: {
      timeRangeForEachDay: {
        start: "09:00",
        end: "17:00",
      },
      availableDayConstraints: {
        type: "daysOfWeek",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday","sunday"],
      },
    },
    timeZone:"CST"
  };
  
  useEffect(() => {
    const getCurrentMeeting = async (meetingId) => {
      try {
        setError(null);
        console.log("getting mett")
        const meetingData = await getMeeting(meetingId);
        console.log(meetingData)
        setMeeting(meetingData);
      } catch (err) {
        setError(err);
        // console.error("Failed to get meeting:", err);
        setMeeting(exampleMeeting);
      }
    }
    
    getCurrentMeeting(meetingId);
  }, [meetingId])

  // Don't render until the meeting has been loaded
  if (!meeting) {
    return <div className="availability-chart loading">Loading meeting...</div>;
  }

  // Now it's safe to destructure
  const { name, availability, availabilityBounds } = meeting;
  
  const { timeRangeForEachDay, availableDayConstraints } = availabilityBounds;

  // Generate an array representing the 15-minute time slots for a day
  const numberOfSlots = calculateTimeSlots(timeRangeForEachDay.start, timeRangeForEachDay.end);
  const timeSlots = Array.from({ length: numberOfSlots }, (_, i) => i);

  

  const addCell = () => {

  }

  const handleCellRepot = (cellName) => {
    console.log(cellName)
  }

  return (
    
    <div className="availability-chart">
      <div className="availability-chart-days">
        {availabilityBounds.availableDayConstraints.type === "daysOfWeek" ? 
          availabilityBounds.availableDayConstraints.days.map((day, index) => (
            <div key={day} className="availability-chart-day">
              <div className="day-name">{day}</div>
            </div>
          ))
          :
          availabilityBounds.availableDayConstraints.days.map((day, index) => (
            <div key={day} className="availability-chart-day">
              <div className="day-name">{day}</div>
              {/* <div className="date-short">{day}/{month}</div> */}
            </div>
          ))
        }
      </div>
      
      <Root>

      <div className="availability-chart-grid">
        {availableDayConstraints.days.map((day) => (
          <div key={day} className="availability-chart-grid-day">
            {timeSlots.map((slotIndex, index) => (
              <InputCell key={day + "-" + index} timeId={day + "-" + index}/>
            ))}
          </div>
        ))}
      </div>
      </Root>
    </div>
  )
}