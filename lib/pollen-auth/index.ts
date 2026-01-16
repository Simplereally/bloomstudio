/**
 * Pollen Auth Module
 *
 * Barrel export for the BYOP (Bring Your Own Pollen) authentication system.
 * This module provides client-side authentication with Pollinations API.
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
} from "./hooks";

// Storage utilities (for advanced use cases)
export {
  storeApiKey,
  getStoredApiKey,
  getStoredMetadata,
  clearStoredAuth,
  isAuthExpired,
  getDaysUntilExpiry,
  isValidApiKeyFormat,
  POLLEN_AUTH_CHANGED_EVENT,
} from "./storage";
export type { PollenAuthMetadata } from "./storage";

// Constants (for configuration and testing)
export {
  STORAGE_KEY,
  STORAGE_EXPIRY_KEY,
  STORAGE_AUTHORIZED_AT_KEY,
  EXPIRY_DAYS,
  EXPIRING_SOON_THRESHOLD_DAYS,
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
