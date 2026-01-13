"use client";

/**
 * Pollen Auth Context
 *
 * React Context provider for managing BYOP (Bring Your Own Pollen) authentication.
 * Provides authentication state and actions throughout the application.
 *
 * This context handles:
 * - Storing and retrieving API keys from localStorage
 * - Tracking authorization expiry
 * - Initiating OAuth flow to Pollinations
 * - Cross-tab synchronization of auth state
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildAuthorizationUrl,
  EXPIRING_SOON_THRESHOLD_DAYS,
  getCallbackUrl,
  STORAGE_KEY,
} from "./constants";
import {
  clearStoredAuth,
  getStoredApiKey,
  getStoredMetadata,
  isAuthExpired as checkIsAuthExpired,
  getDaysUntilExpiry as calcDaysUntilExpiry,
  POLLEN_AUTH_CHANGED_EVENT,
  type PollenAuthMetadata,
} from "./storage";

/**
 * State representing the current BYOP authorization.
 */
export interface PollenAuthState {
  /** The BYOP API key (null if not authorized) */
  apiKey: string | null;
  /** Whether the user is currently authorized with a valid key */
  isAuthorized: boolean;
  /** When the current authorization expires (null if not authorized) */
  expiresAt: Date | null;
  /** Days until expiration (null if not authorized) */
  daysUntilExpiry: number | null;
  /** Whether authorization is expiring soon (< threshold days) */
  isExpiringSoon: boolean;
  /** Whether the stored key has expired */
  isExpired: boolean;
  /** Whether the auth state is still being loaded from storage */
  isLoading: boolean;
}

/**
 * Actions available for managing BYOP authorization.
 */
export interface PollenAuthActions {
  /** Initiates OAuth flow to Pollinations */
  authorize: () => void;
  /** Clears stored authorization */
  deauthorize: () => void;
  /** Refreshes auth state from localStorage */
  refreshAuthState: () => void;
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
  expiresAt: null,
  daysUntilExpiry: null,
  isExpiringSoon: false,
  isExpired: false,
  isLoading: true,
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
  refreshAuthState: () => {
    console.warn("[PollenAuth] refreshAuthState called outside of provider");
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
 * Derives auth state from stored API key and metadata.
 */
function deriveAuthState(
  apiKey: string | null,
  metadata: PollenAuthMetadata | null
): Omit<PollenAuthState, "isLoading"> {
  const isExpired = checkIsAuthExpired();
  const daysUntilExpiry = calcDaysUntilExpiry();
  const isAuthorized = Boolean(apiKey) && !isExpired;
  const isExpiringSoon =
    isAuthorized &&
    daysUntilExpiry !== null &&
    daysUntilExpiry <= EXPIRING_SOON_THRESHOLD_DAYS;

  return {
    apiKey: isAuthorized ? apiKey : null,
    isAuthorized,
    expiresAt: metadata ? new Date(metadata.expiresAt) : null,
    daysUntilExpiry,
    isExpiringSoon,
    isExpired: Boolean(apiKey) && isExpired,
  };
}

/**
 * Provider component for BYOP authentication.
 *
 * Wrap your application or Studio layout with this provider to enable
 * BYOP authentication throughout the component tree.
 *
 * @example
 * ```tsx
 * <PollenAuthProvider>
 *   <App />
 * </PollenAuthProvider>
 * ```
 */
export function PollenAuthProvider({ children }: PollenAuthProviderProps) {
  const [state, setState] = useState<PollenAuthState>(defaultState);

  /**
   * Loads auth state from localStorage.
   */
  const loadAuthState = useCallback(() => {
    const apiKey = getStoredApiKey();
    const metadata = getStoredMetadata();
    const derivedState = deriveAuthState(apiKey, metadata);

    setState({
      ...derivedState,
      isLoading: false,
    });
  }, []);

  /**
   * Initiates the OAuth flow by redirecting to Pollinations.
   */
  const authorize = useCallback(() => {
    const callbackUrl = getCallbackUrl();
    const authUrl = buildAuthorizationUrl(callbackUrl);
    window.location.href = authUrl;
  }, []);

  /**
   * Clears the stored authorization and resets state.
   */
  const deauthorize = useCallback(() => {
    clearStoredAuth();
    setState({
      ...defaultState,
      isLoading: false,
    });
  }, []);

  /**
   * Refreshes auth state from localStorage.
   * Useful after callback handler stores new key.
   */
  const refreshAuthState = useCallback(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Initialize auth state on mount
  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Listen for storage changes from other tabs (native storage event)
  // and same-tab changes (custom event dispatched by storage utilities)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        // Key changed or storage was cleared
        loadAuthState();
      }
    };

    // Handle same-tab storage changes via custom event
    const handleAuthChanged = () => {
      loadAuthState();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(POLLEN_AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(POLLEN_AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [loadAuthState]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PollenAuthContextValue>(
    () => ({
      ...state,
      _fromProvider: true,
      authorize,
      deauthorize,
      refreshAuthState,
    }),
    [state, authorize, deauthorize, refreshAuthState]
  );

  return (
    <PollenAuthContext.Provider value={contextValue}>
      {children}
    </PollenAuthContext.Provider>
  );
}
