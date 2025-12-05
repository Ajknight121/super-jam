type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user: {
      isLoggedIn: boolean;
      name: string;
    } | null;
  }
}

interface Env {
  DB: D1Database;
}
