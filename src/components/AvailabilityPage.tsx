import { useState, useEffect } from "react";
import AvailabilityChart from "./AvailabilityChart";
import "./AvailabilityPage.css";
import { createUser } from "../lib/api/users";
import SignIn from "./SignIn";
import { authClient } from "../lib/auth-client";
export default function AvailabilityPage({ meetingId }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function checkSession() {
      // Check for a better-auth session when the page loads
      const session = await authClient.getSession();
      if (session.data?.user?.id) {
        setAuthId(session.data.user.id);
      }
    }
    checkSession();
  }, []);

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
        <AvailabilityChart meetingId={meetingId} userId={userId} authId={authId} />
      </div>

      <div className="login">
        {userId ? (
          <div>You are logged in. Add your availability above.
            <a
              href={`/auth/google?callbackURL=${encodeURIComponent(window.location.href)}`}
              className="google-signin-button"
            >
              Sign in with Google
            </a>
          </div>
        ) : (
          <div>
            <SignIn
              name={name}
              setName={setName}
              password={password}
              setPassword={setPassword}
              busy={busy}
              error={error}
              handleSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
