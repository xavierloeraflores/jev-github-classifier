import "server-only";

// Uses AI_GATEWAY_API_KEY, or Vercel OIDC when no API key is configured.
export { gateway } from "ai";
