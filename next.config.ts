import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // No release-scoped auth token is configured -- skip source map upload
  // rather than have the build plugin fail trying to reach the API.
  sourcemaps: {
    disable: true,
  },
});
