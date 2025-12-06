type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

export interface Session {
	id: string;
	expiresAt: Date;
	userId: number;
}

declare namespace App {
  interface Locals extends Runtime {
    sessions: Session | null,
    user: {
      isLoggedIn: boolean;
      name: string;
    } | null;
  }
}

interface Env {
  DB: D1Database;
}
