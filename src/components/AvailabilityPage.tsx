import { useState } from "react";
import AvailabilityChart from "./AvailabilityChart";
import "./AvailabilityPage.css";
import { createUser } from "../lib/api/users";
import SignIn from "./SignIn";
import AuthStatus from "./AuthStatus";

export default function AvailabilityPage({ meetingId }) {
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
  const [user, setUser] = useState(null)

  return (
    <div className="availability-page">
      <div className="availabilities">
        <AvailabilityChart meetingId={meetingId} userId={userId} />
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
