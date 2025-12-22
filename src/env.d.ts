type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Session {
	id: string;
	expiresAt: Date;
	userId: number;
}

declare namespace App {
  interface Locals {
    runtime: Runtime & { env: Env };
    session: Session | null,
    user: {
      isLoggedIn: boolean;
      name: string;
      googleAccessToken: string;
    } | null;
  }
}

interface Env {
  DB: D1Database;
}
