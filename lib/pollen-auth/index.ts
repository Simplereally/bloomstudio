/**
 * Pollen Auth Module
 *
 * Barrel export for the BYOP (Bring Your Own Pollen) authentication system.
 * This module provides client-side authentication with Pollinations API.
 *
 * Architecture:
 * - Convex is the single source of truth for API key storage
 * - Keys are stored encrypted in Convex (AES-256-GCM)
 * - No localStorage caching - simplifies sync and improves security
 *
 * Note: Expiry tracking has been removed. Invalid/expired keys are detected
 * via 401 responses from the Pollinations API during generation.
 *
 * ## Usage
 *
 * 1. Wrap your app with `PollenAuthProvider`:
 * ```tsx
 * import { PollenAuthProvider } from "@/lib/pollen-auth";
 *
 * function App() {
 *   return (
 *     <PollenAuthProvider>
 *       <YourApp />
 *     </PollenAuthProvider>
 *   );
 * }
 * ```
 *
 * 2. Use the hooks in your components:
 * ```tsx
 * import { usePollenAuth } from "@/lib/pollen-auth";
 *
 * function GenerateButton() {
 *   const { isAuthorized, authorize, apiKey } = usePollenAuth();
 *   // ...
 * }
 * ```
 */

// Context and Provider
export { PollenAuthContext, PollenAuthProvider } from "./context";
export type {
  PollenAuthState,
  PollenAuthActions,
  PollenAuthContextValue,
} from "./context";

// Hooks
export {
  usePollenAuth,
  usePollenAuthState,
  usePollenAuthActions,
  useIsPollenConnected,
  usePollenApiKey,
  useNeedsReconnect,
} from "./hooks";

// Validation utilities
export { isValidApiKeyFormat } from "./storage";

// Constants (for OAuth flow)
export {
  POLLINATIONS_AUTH_BASE_URL,
  CALLBACK_KEY_PARAM,
  buildAuthorizationUrl,
  getCallbackUrl,
} from "./constants";

// Balance Service
export {
  fetchPollenBalance,
  isBalanceError,
  buildAuthHeader,
  buildBalanceUrl,
  parseBalanceResponse,
  POLLINATIONS_API_BASE,
} from "./balance-service";
export type {
  PollenBalanceResponse,
  BalanceError,
  BalanceErrorCode,
} from "./balance-service";
