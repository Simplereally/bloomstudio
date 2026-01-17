"use client";

/**
 * Pollen Auth Context
 *
 * React Context provider for managing BYOP (Bring Your Own Pollen) authentication.
 * Provides authentication state and actions throughout the application.
 *
 * Architecture:
 * - Convex is the single source of truth for the API key
 * - Key is stored encrypted in Convex, decrypted on query
 * - No localStorage caching - simplifies sync and improves security
 *
 * Note: Expiry tracking has been intentionally removed. Invalid/expired keys
 * are detected via 401 responses from the Pollinations API.
 */

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { buildAuthorizationUrl, getCallbackUrl } from "./constants";

/**
 * State representing the current BYOP authorization.
 */
export interface PollenAuthState {
  /** The BYOP API key (null if not authorized) */
  apiKey: string | null;
  /** Whether the user is currently authorized with a valid key */
  isAuthorized: boolean;
  /** Whether the auth state is still being loaded */
  isLoading: boolean;
  /**
   * Whether the user needs to reconnect due to an invalid/expired key.
   * Set to true when a 401 error is received from the Pollinations API.
   * When true, the ReconnectModal should be shown.
   */
  needsReconnect: boolean;
}

/**
 * Actions available for managing BYOP authorization.
 */
export interface PollenAuthActions {
  /** Initiates OAuth flow to Pollinations */
  authorize: () => void;
  /** Clears stored authorization */
  deauthorize: () => void;
  /**
   * Sets the needsReconnect flag.
   * Call with `true` when a 401 error is received from Pollinations API.
   * Call with `false` after successful reconnection.
   */
  setNeedsReconnect: (value: boolean) => void;
}

/**
 * Combined context value type.
 */
export type PollenAuthContextValue = PollenAuthState &
  PollenAuthActions & {
    /**
     * Internal sentinel to detect if this value came from a provider.
     * @internal
     */
    _fromProvider: boolean;
  };

/**
 * Default state when no authorization exists.
 */
const defaultState: PollenAuthState = {
  apiKey: null,
  isAuthorized: false,
  isLoading: true,
  needsReconnect: false,
};

/**
 * React Context for Pollen Auth.
 * Initialized with default state and no-op actions.
 */
export const PollenAuthContext = createContext<PollenAuthContextValue>({
  ...defaultState,
  _fromProvider: false,
  authorize: () => {
    console.warn("[PollenAuth] authorize called outside of provider");
  },
  deauthorize: () => {
    console.warn("[PollenAuth] deauthorize called outside of provider");
  },
  setNeedsReconnect: () => {
    console.warn("[PollenAuth] setNeedsReconnect called outside of provider");
  },
});

PollenAuthContext.displayName = "PollenAuthContext";

/**
 * Props for the PollenAuthProvider component.
 */
interface PollenAuthProviderProps {
  children: ReactNode;
}

/**
 * Provider component for BYOP authentication.
 *
 * Wrap your application or Studio layout with this provider to enable
 * BYOP authentication throughout the component tree.
 *
 * The provider uses Convex as the single source of truth for the API key.
 * State is derived directly from the Convex query result.
 *
 * @example
 * ```tsx
 * <PollenAuthProvider>
 *   <App />
 * </PollenAuthProvider>
 * ```
 */
export function PollenAuthProvider({ children }: PollenAuthProviderProps) {
  // Convex query - single source of truth for the API key
  // Returns decrypted key or null if not set
  const serverApiKey = useQuery(api.users.getPollinationsApiKey);
  const removeApiKey = useMutation(api.users.removePollinationsApiKey);

  // Local state for needsReconnect (UI-only concern, not persisted)
  const [needsReconnect, setNeedsReconnectState] = useState(false);

  // Derive auth state from Convex query
  // undefined = loading, null = no key, string = has key
  const isLoading = serverApiKey === undefined;
  const apiKey = serverApiKey ?? null;
  const isAuthorized = Boolean(apiKey);

  /**
   * Initiates the OAuth flow by redirecting to Pollinations.
   */
  const authorize = useCallback(() => {
    const callbackUrl = getCallbackUrl();
    const authUrl = buildAuthorizationUrl(callbackUrl);
    window.location.href = authUrl;
  }, []);

  /**
   * Clears the stored authorization from Convex.
   */
  const deauthorize = useCallback(() => {
    removeApiKey().catch((err) => {
      console.error("[PollenAuth] Failed to remove key from server:", err);
    });
    // Reset needsReconnect when user explicitly disconnects
    setNeedsReconnectState(false);
  }, [removeApiKey]);

  /**
   * Sets the needsReconnect flag.
   * Call with `true` when a 401 error is received, `false` after reconnection.
   */
  const setNeedsReconnect = useCallback(
    (value: boolean) => {
      setNeedsReconnectState(value);

      // If setting needsReconnect to true, also clear the stored auth
      // since the key is no longer valid
      if (value) {
        removeApiKey().catch((err) => {
          console.error("[PollenAuth] Failed to remove invalid key:", err);
        });
      }
    },
    [removeApiKey],
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PollenAuthContextValue>(
    () => ({
      apiKey,
      isAuthorized,
      isLoading,
      // Clear needsReconnect if we have a valid key (user just reconnected)
      needsReconnect: isAuthorized ? false : needsReconnect,
      _fromProvider: true,
      authorize,
      deauthorize,
      setNeedsReconnect,
    }),
    [
      apiKey,
      isAuthorized,
      isLoading,
      needsReconnect,
      authorize,
      deauthorize,
      setNeedsReconnect,
    ],
  );

  return (
    <PollenAuthContext.Provider value={contextValue}>
      {children}
    </PollenAuthContext.Provider>
  );
}
