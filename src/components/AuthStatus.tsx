// src/components/AuthStatus.tsx
import React, { useState, useEffect } from 'react';

interface AuthProps {
  user: {
    isLoggedIn: boolean;
    name: string;
  } | null;
}

export default function AuthStatus() {
  const [user, setUser] = useState<AuthProps['user']>(null);
  const [loading, setLoading] = useState(true);
  const [signInHref, setSignInHref] = useState("/api/auth/google");

  useEffect(() => {
    // Fetch user status from our new API endpoint
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });

    // Determine the meetingId from the URL for the redirect
    const path = window.location.pathname;
    const match = path.match(/\/availability\/([^/]+)/);
    const meetingId = match ? match[1] : null;
    
    if (meetingId) {
      setSignInHref(`/api/auth/google?meetingId=${meetingId}`);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  if (loading) {
    return <div className="p-4">Checking status...</div>;
  }

  const handleSignOut = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.reload();
    }
  };

  if (user?.isLoggedIn) {
    return (
      <div className="p-4 border rounded bg-green-50">
        <p>Welcome back, {user.name}!</p>
        <button type='button' onClick={handleSignOut} className="text-red-500 underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-gray-50">
      <p>Please log in to continue.</p>
      {/* DIRECT LINK to the API route */}
      <a
        href={signInHref}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Sign in with Google
      </a>
    </div>
  );
}