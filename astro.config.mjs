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
        "default-src 'self' 'sha256-dd4J3UnQShsOmqcYi4vN5BT3mGZB/0fOwBA72rsguKc=' 'sha256-kAuJtpHzsuUXU5fKQIGT7DNPr8DmAEAsB96A7yaxQ6I=' 'sha256-tSGVRioWH5Kkh/yge9evXQLN7uo4SMVa8/5rYE0Ad+k=' 'sha256-Epg1E01hrkVp73prHNyzTGMJ0rrPDw30WjGORyWDUU8=' 'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow=' 'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c=' 'sha256-U7a72oKuFFz8D7GUHLA1NZ0ciymHmDOc9T9aVDg2rWU=' 'sha256-35KBScVH0mcisYaS+jYHDa1tlFGmOrghafQWiYvD7Us=' ", 
        "img-src 'self' https://lipsum.app/",
        "font-src 'self' https://fonts.google.com/ https://fontsource.org/ data:font/woff2;base64,d09GMgABAAAAAA/kABAAAAAAKewAAA+DAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGoESG45OHIFKBmA/U1RBVC4AgwQRCAqmFKFyC4IWAAE2AiQDhAgEIAWERAeKGAwHG5olFeOYJbBxAIF/f8YE/18ncDoEspfpFY6A2La27VaF5oNYq90uYhtP9Wt9v/eGf8PBXiAyc1LFFCKDNzC14grrl6uXGOizO3FjBPVjvO7dvRCQSxyTcIAFAN35uuA6PhWuU6FIAqJM7uf5bfXnvoeAlNWgYj5xxEhoC7AwInFGjEIRmcx0dmfV3R+gE8V2GZOI4qUbDQiOF+BujW2r+4p45QiZkk1KhxRV9KX/3xvPo4CbzXhPGMkwnTrz489ZTSHx7QISqnOJEDEqfl/zfZcq2br4Rb9zwxIYgjwyNmHdNrV50JVNwOp/v9an7dt3ztT//ZdmAUCG/IAws5uwJLuO3uvXXf/u+/1pqqu2...GTFzYObz58cfnxFyCwOEGCEULwhJojDD+hcBEiRZVEFyNWnHgJBIRExCSksN0UCMrhYrp6+qX3mMrQqBzXbty6c+/BoyfPXrx6816RD5++fPvx64/Hr0wgxEXhfolUJlcoVYSxiamZuYWllbWNLVGA/Slf8qNFlSIXu7YvMQCh5LQ8BoUBCxhwOwU4wVR48+3l3JgaAELJaX2JBZyjfSle3wL9eVqExyJ2ILCgQAt3C7q+e3ibiGmVyuFOtwwauXEELbTUOHzuYjRndbI0cES5ogueD/ONmQbe/7vJcHNk2CtZwDtbwGACQYUeAgcmbBCgsE+OxdQECGpO70tskJzTl5Ir2SA9P4BgQ4UOE041OxQgUOGAAUGvNg8XsIFA4MzEwGImHWxg+t2eEUIM9+jDQSiq2D9BhdZJKfv1KJeeeMFi7gSZXuNkB5lgLe0iESL/9NUu4VqInIdi/uErvYjOtqLasyOvGMImpRgVw772uf76lmbZhsia/yzqjAEA",
      ],
      styleDirective: {
        resources: [
          "'self'",
          "'sha256-6AI67S7OdZ1tnbpP7DEcM7QG6DGH5xj8CXJv7gsgjv0='",
          "'sha256-nV/G7sFVaJB03McwJHvCSHdKsvmG5uaOg0YFokvlKGA='",
          "'sha256-m6quyuX3igpBZcDrVBilLiWjNYTfeeNFr5AzJ8Xra9U='",
          "'sha256-vv9IoKo7BSLbWcUHr3tNmfNVmm5L/9Cfn2H6LMk7/ow='",
          "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
          "'sha256-Hk70poV4gtPx3YsU2xuFYNYNK6O6ARdFd3JjccYJVOA='",
          "'sha256-35KBScVH0mcisYaS+jYHDa1tlFGmOrghafQWiYvD7Us='",
          "'sha256-dd4J3UnQShsOmqcYi4vN5BT3mGZB/0fOwBA72rsguKc='",
          "'sha256-35KBScVH0mcisYaS+jYHDa1tlFGmOrghafQWiYvD7Us='",

        ]
      },
      scriptDirective: {
        resources: [
          "'self'",
          "'sha256-BF0290pkb3jxQsE7z00xR8Imp8X34FLC88L0lkMnrGw='",
          "'sha256-QzWFZi+FLIx23tnm9SBU4aEgx4x8DsuASP07mfqol/c='",
          "'sha256-0chmwFk0zaA528yFfGV7J9ppIpdfTPPULncDF3WG7Zs='",
          "'sha256-eIXWvAmxkr251LJZkjniEK5LcPF3NkapbJepohwYRIc='",
          "'sha256-Q2BPg90ZMplYY+FSdApNErhpWafg2hcRRbndmvxuL/Q='",
          "'sha256-U7a72oKuFFz8D7GUHLA1NZ0ciymHmDOc9T9aVDg2rWU='",
          "'sha256-p9VbHs/ClkQc+x63XdUjvCAgeWxA4ZGvpebJtMn9jbs='",
          "'sha256-kAuJtpHzsuUXU5fKQIGT7DNPr8DmAEAsB96A7yaxQ6I='",
          "'sha256-tSGVRioWH5Kkh/yge9evXQLN7uo4SMVa8/5rYE0Ad+k='",
        ]
      },
    }
  },

  integrations: [react()],
});
