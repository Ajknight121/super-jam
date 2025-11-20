import { useState } from "react";
import AvailabilityChart from "./AvailabilityChart";
import "./AvailabilityPage.css";
import SignIn from "./SignIn";

const maxSegments = 5;

function getGradientColor(ratio) {
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const value = clamp(ratio * 100, 0, 100);

  const start = { r: 237, g: 243, b: 252 };
  const end = { r: 0, g: 74, b: 187 };

  const r = Math.round(start.r + (end.r - start.r) * (value / 100));
  const g = Math.round(start.g + (end.g - start.g) * (value / 100));
  const b = Math.round(start.b + (end.b - start.b) * (value / 100));
  return `rgb(${r},${g},${b})`;
}

const colors = Array.from({ length: maxSegments }, (_, i) => {
  const ratio = maxSegments > 1 ? i / (maxSegments - 1) : 0;
  return getGradientColor(ratio);
});

export default function AvailabilityPage({ meetingId }) {
  const isSignedIn = false;
  const isEditing = false;

  const totalPeople = 12;
  const maxAvailable = 10;

  const [userId, setUserId] = useState();

  return (
    <div className="availability-page">
      <div className="meeting-details">
        <div className="meeting-title">Meeting Name</div>
        <div className="timezone">
          <div>Original Timezone (CST)</div>
          <div></div>
          <div>Current Timezone (CST)</div>
        </div>
      </div>

      <div className="availabilities">
        <div className="scale">
          <div className="label">0/{totalPeople}</div>
          <div className="scale-container">
            {colors.map((color) => (
              <div
                // TODO: Is this the right thing for a key?
                key={color}
                className="scale-segment"
                style={{ backgroundColor: color }}
              ></div>
            ))}
          </div>
          <div className="label">
            {maxAvailable}/{totalPeople}
          </div>
        </div>
        <AvailabilityChart meetingId={meetingId} userId={userId} />
      </div>

      <div className="login">
        {isEditing ? (
          <div className="edit-button">
            {/* {isSignedIn ? "Edit Availability" : (<div>Sign In </b> & </b> Add Availability</div>)} */}
            <div className="circle-button">
              <div className="circle-button-text">Edit Availability</div>
            </div>
          </div>
        ) : isSignedIn ? (
          <div>Add your availability above</div>
        ) : (
          <SignIn />
        )}
      </div>
    </div>
  );
}
