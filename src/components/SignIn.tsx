import { useEffect, useState } from "react";
import "./SignIn.css";
import { createUser } from "../lib/api/users";

export default function SignIn({ name, setName }: { name: string; setName: (name: string) => void }) {
  // biome-ignore lint/style/noNonNullAssertion: Samuel Skean: I don't want these to ever be null.
  name!;

  const [password, setPassword] = useState("");
  // biome-ignore lint/style/noNonNullAssertion: Samuel Skean: I don't want these to ever be null.
  password!;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODONOW(samuel-skean): Remove.
  console.log(`Name: ${name} Password: ${password}`);

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
        setName(trimmed);
      } else {
        setError("Unexpected error creating user.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to create user.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    console.log(`Name: ${name} Password: ${password}`);
  }, [name, password]);

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
