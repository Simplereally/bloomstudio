"use client";

/**
 * Pollen Auth Hooks
 *
 * React hooks for consuming the BYOP authentication context.
 * Use these hooks in client components to access auth state and actions.
 */

import { useContext } from "react";
import {
  PollenAuthContext,
  type PollenAuthContextValue,
  type PollenAuthState,
  type PollenAuthActions,
} from "./context";

/**
 * Hook to access the full BYOP authentication context.
 *
 * Provides both state (apiKey, isAuthorized, etc.) and actions (authorize, deauthorize).
 *
 * @throws If used outside of PollenAuthProvider
 *
 * @example
 * ```tsx
 * function GenerateButton() {
 *   const { isAuthorized, authorize, apiKey } = usePollenAuth();
 *
 *   if (!isAuthorized) {
 *     return <button onClick={authorize}>Connect to Pollinations</button>;
 *   }
 *
 *   return <button onClick={() => generateImage(apiKey)}>Generate</button>;
 * }
 * ```
 */
export function usePollenAuth(): PollenAuthContextValue {
  const context = useContext(PollenAuthContext);

  if (!context._fromProvider) {
    throw new Error(
      "[usePollenAuth] must be used within a PollenAuthProvider. " +
      "Make sure your component is wrapped in <PollenAuthProvider>."
    );
  }

  return context;
}

/**
 * Hook to access only the BYOP authentication state (read-only).
 *
 * Useful when you only need to check auth status without performing actions.
 *
 * @example
 * ```tsx
 * function AuthStatus() {
 *   const { isAuthorized, isExpiringSoon, daysUntilExpiry } = usePollenAuthState();
 *
 *   if (isExpiringSoon) {
 *     return <span>Expires in {daysUntilExpiry} days</span>;
 *   }
 *
 *   return <span>{isAuthorized ? "Connected" : "Not connected"}</span>;
 * }
 * ```
 */
export function usePollenAuthState(): PollenAuthState {
  const {
    apiKey,
    isAuthorized,
    expiresAt,
    daysUntilExpiry,
    isExpiringSoon,
    isExpired,
    isLoading,
  } = usePollenAuth();

  return {
    apiKey,
    isAuthorized,
    expiresAt,
    daysUntilExpiry,
    isExpiringSoon,
    isExpired,
    isLoading,
  };
}

/**
 * Hook to access only the BYOP authentication actions.
 *
 * Useful when you only need to trigger auth actions without reading state.
 *
 * @example
 * ```tsx
 * function ConnectButton() {
 *   const { authorize } = usePollenAuthActions();
 *   return <button onClick={authorize}>Connect</button>;
 * }
 * ```
 */
export function usePollenAuthActions(): PollenAuthActions {
  const { authorize, deauthorize, refreshAuthState } = usePollenAuth();

  return {
    authorize,
    deauthorize,
    refreshAuthState,
  };
}

/**
 * Hook to check if the user has a valid, non-expired API key.
 *
 * Simple boolean check for conditional rendering.
 *
 * @example
 * ```tsx
 * function ProtectedFeature() {
 *   const isConnected = useIsPollenConnected();
 *
 *   if (!isConnected) {
 *     return <ConnectPrompt />;
 *   }
 *
 *   return <ProtectedContent />;
 * }
 * ```
 */
export function useIsPollenConnected(): boolean {
  const { isAuthorized, isLoading } = usePollenAuth();

  // Return false while loading to prevent flash of protected content
  if (isLoading) {
    return false;
  }

  return isAuthorized;
}

/**
 * Hook to get the BYOP API key if available and valid.
 *
 * Returns null if not authorized, expired, or still loading.
 *
 * @example
 * ```tsx
 * function GenerationHook() {
 *   const apiKey = usePollenApiKey();
 *
 *   const generate = async () => {
 *     if (!apiKey) {
 *       throw new Error("Not authorized");
 *     }
 *     await callPollinationsApi(apiKey);
 *   };
 * }
 * ```
 */
export function usePollenApiKey(): string | null {
  const { apiKey, isAuthorized } = usePollenAuth();

  if (!isAuthorized) {
    return null;
  }

  return apiKey;
}
