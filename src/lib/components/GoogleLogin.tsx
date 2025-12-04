import { authClient } from "../auth-client";

export default function GoogleLogin() {
  const { data: session, isPending } = authClient.useSession();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.pathname, // Redirect here after login
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isPending) return <div>Loading...</div>;

  if (session) {
    return (
      <div>
        <img src={session.user.image as string} alt={session.user.name} />
        <p>Hello, {session.user.name}</p>
        <button type="button" onClick={handleSignOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <button type="button" onClick={handleSignIn}>
      Continue with Google
    </button>
  );
}