import { useEffect, useState } from "react";
import "./SignIn.css";
export default function SignIn({ name, setName }) {
  // biome-ignore lint/style/noNonNullAssertion: Samuel Skean: I don't want these to ever be null.
  name!;

  const [password, setPassword] = useState("");
  // biome-ignore lint/style/noNonNullAssertion: Samuel Skean: I don't want these to ever be null.
  password!;

  // TODONOW(samuel-skean): Remove.
  console.log(`Name: ${name} Password: ${password}`);

  return (
    <form onSubmit={setName} className="login-form">
      <div className="login-inputs">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password (Optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
