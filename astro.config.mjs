// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  vite: {
    build: {
      sourcemap: true,
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },

    imageService: "cloudflare",
  }),
  experimental: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' https://lipsum.app/",
        "font-src 'self' https://fonts.google.com/",
      ],
      styleDirective: {
        resources: [
          "'self'",
          'sha256-6AI67S7OdZ1tnbpP7DEcM7QG6DGH5xj8CXJv7gsgjv0=',
          'sha256-nV/G7sFVaJB03McwJHvCSHdKsvmG5uaOg0YFokvlKGA=',
          'sha256-m6quyuX3igpBZcDrVBilLiWjNYTfeeNFr5AzJ8Xra9U=',
          'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow=',
          'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
          'sha256-Hk70poV4gtPx3YsU2xuFYNYNK6O6ARdFd3JjccYJVOA='
        ]
      },
    }
  },

  integrations: [react()],
});
