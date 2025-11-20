import { useEffect } from "react";
import "./SignIn.css";

export default function SignIn({
  name,
  setName,
  password,
  setPassword,
  busy,
  error,
  handleSubmit,
}: {
  name: string;
  setName: (name: string) => void;
  password;
  string;
  setPassword: (password: string) => void;
  busy: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}) {

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-inputs">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <input
          type="password"
          placeholder="Password (Optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </div>

      {error ? <div role="alert" style={{ color: "crimson", marginTop: 8 }}>{error}</div>: null}

      <button type="submit" disabled={busy} style={{ marginTop: 10 }}>
        {busy ? "Creating User..." : "Submit"}
      </button>
    </form>
  );
}
