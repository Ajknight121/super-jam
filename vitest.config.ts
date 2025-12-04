import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the TypeScript path alias used in tsconfig.json
      "#/src": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // The server endpoints use Web platform types like `Response` and
    // Vitest with Node environment (Node18+) exposes fetch/Response.
    environment: "node",
  },
});
