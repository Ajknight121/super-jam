import { useEffect, useState } from "react";
import AvailabilityChart from "./AvailabilityChart";
import "./AvailabilityPage.css";
import SignIn from "./SignIn";
import AuthStatus from "./AuthStatus";
import { getMeeting, loginUser, registerUser } from "../lib/api/meetings";
import { type APIMeeting } from "#/src/api-types-and-schemas";

export default function AvailabilityPage({ meetingId }) {
  const [userId, setUserId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<APIMeeting | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      setError("Please enter a name.");
      setBusy(false);
      return;
    }

    try {
      const member = meeting?.members.find(
        (m) => m.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (member) {
        // User exists, so log them in
        await loginUser(meetingId, member.memberId, password);
        // After a successful login, the page will likely need to re-fetch user-specific data.
        // For now, we can set the user ID. A page reload or state update to reflect the logged-in status would be ideal.
        setUserId(member.memberId);
      } else {
        // User does not exist, so register them
        const result = await registerUser(meetingId, trimmedName, password);
        if (result?.memberId) {
          setUserId(result.memberId);
        } else {
          setError("Unexpected error creating user.");
        }
      }
    } catch (err: any) {
      if (err.response) {
        // Handle specific API errors
        const errorData = await err.response.json();
        setError(errorData.error || "An unknown error occurred.");
      } else {
        setError(err?.message ?? "An unknown error occurred.");
      }
    } finally {
      setBusy(false);
    }
  }
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function fetchMeeting() {
      if (meetingId) {
        try {
          const meetingData = await getMeeting(meetingId);
          setMeeting(meetingData);
        } catch (err) {
          console.error("Failed to load meeting:", err);
          // Optionally set an error state to show in the UI
        }
      }
    }
    fetchMeeting();
  }, [meetingId]);

  return (
    <div className="availability-page">
      <div className="availabilities">
        <AvailabilityChart meeting={meeting} meetingId={meetingId} userId={userId} />
      </div>

      <div className="login">
        <AuthStatus user={user} meetingId={meetingId}/>
        {userId ? (
          <div>You are logged in. Add your availability above.
          </div>
          
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
