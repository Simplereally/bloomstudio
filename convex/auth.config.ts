/**
 * Convex Auth Configuration
 *
 * Server-side configuration for validating Clerk JWT tokens.
 * The JWT template must be named "convex" in Clerk Dashboard.
 */
import { AuthConfig } from "convex/server"

export default {
  providers: [
    {
      // Clerk JWT Issuer Domain from the "convex" JWT template
      // Configure CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard environment variables
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig
