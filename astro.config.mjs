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
        "worker-src 'none'",
      ],
      styleDirective: {
        resources: [
          "'self'",
          // default hashes
          "'sha256-Epg1E01hrkVp73prHNyzTGMJ0rrPDw30WjGORyWDUU8='",
          "'sha256-nV/G7sFVaJB03McwJHvCSHdKsvmG5uaOg0YFokvlKGA='",
          "'sha256-6QP2Bi5lBQlaTKBDx758tKXVKebdak/FhsDTMUWewOI='",
          "'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='",
          "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
          // calendar hash
          "'sha256-Hk70poV4gtPx3YsU2xuFYNYNK6O6ARdFd3JjccYJVOA='",
          // mystery availability hash
          "'sha256-35KBScVH0mcisYaS+jYHDa1tlFGmOrghafQWiYvD7Us='",
        ]
      },
      /*
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
