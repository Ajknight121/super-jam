import { useState } from "react";
import AvailabilityChart from "./AvailabilityChart";
import "./AvailabilityPage.css";
import { createUser } from "../lib/api/users";
import SignIn from "./SignIn";

export default function AvailabilityPage({ meetingId }) {
  const isSignedIn = false;
  const isEditing = false;

  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = (name || "").trim();
    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }

    try {
      setBusy(true);

      const result = await createUser(trimmed);
      if (result?.id) {
        setUserId(result.id);
      } else {
        setError("Unexpected error creating user.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to create user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="availability-page">
      <div className="availabilities">
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
          <SignIn
            name={name}
            setName={setName}
            password={password}
            setPassword={setPassword}
            busy={busy}
            error={error}
            handleSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
