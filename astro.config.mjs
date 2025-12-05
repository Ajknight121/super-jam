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
        "font-src 'self' https://fonts.google.com/ https://fontsource.org/",
      ],
      /* styleDirective: {
        resources: [

        ]
      },
      scriptDirective: {
        resources: [
          "'self'",
        ]
      },
      */
    }
  },

  integrations: [react()],
});
