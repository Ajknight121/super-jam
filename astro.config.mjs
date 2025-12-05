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
        "object-src 'none'",
        "base-uri 'self'",
        "connect-src 'self'",
        "frame-src 'self'",
        "manifest-src 'self'",
        "media-src 'self'",
        "report-uri https://6932386003e177f52dcf1163.endpoint.csper.io/?v=0",
        "worker-src 'none'",
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
