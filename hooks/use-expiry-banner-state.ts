"use client";

/**
 * useExpiryBannerState Hook
 *
 * Manages dismissed state for the expiry banner with sessionStorage persistence.
 * Combines auth state with UI visibility logic.
 */

import { useState, useCallback, useEffect } from "react";
import { usePollenAuth } from "@/lib/pollen-auth";

const DEFAULT_STORAGE_KEY = "pollen_expiry_banner_dismissed";

/**
 * Return type for useExpiryBannerState hook
 */
export interface UseExpiryBannerStateReturn {
  // Auth-derived state
  isExpiringSoon: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  isAuthLoading: boolean;

  // UI state
  isDismissed: boolean;
  isRedirecting: boolean;
  shouldShow: boolean;

  // Computed display values
  daysText: string;

  // Handlers
  handlers: {
    handleDismiss: () => void;
    handleReconnect: () => void;
  };
}

export interface UseExpiryBannerStateOptions {
  /** Storage key for dismissed state persistence */
  storageKey?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
}

/**
 * Hook for managing expiry banner state.
 *
 * Handles sessionStorage persistence for dismissed state and provides
 * computed values for display.
 *
 * @example
 * ```tsx
 * function ExpiryBanner() {
 *   const { shouldShow, daysText, handlers } = useExpiryBannerState();
 *
 *   if (!shouldShow) return null;
 *
 *   return (
 *     <Alert>
 *       <span>Expires {daysText}</span>
 *       <Button onClick={handlers.handleReconnect}>Reconnect</Button>
 *     </Alert>
 *   );
 * }
 * ```
 */
export function useExpiryBannerState({
  storageKey = DEFAULT_STORAGE_KEY,
  dismissible = true,
}: UseExpiryBannerStateOptions = {}): UseExpiryBannerStateReturn {
  const { isExpiringSoon, isExpired, daysUntilExpiry, authorize, isLoading } =
    usePollenAuth();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check sessionStorage on mount for dismissed state
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const dismissed = sessionStorage.getItem(storageKey);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    if (!dismissible) return;

    setIsDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // Ignore storage errors
    }
  }, [storageKey, dismissible]);

  const handleReconnect = useCallback(() => {
    setIsRedirecting(true);
    authorize();
  }, [authorize]);

  // Compute whether banner should be shown
  const shouldShow =
    !isLoading && !isDismissed && (isExpiringSoon || isExpired);

  // Compute days text for display
  const daysText =
    daysUntilExpiry === null
      ? ""
      : daysUntilExpiry === 0
        ? "today"
        : daysUntilExpiry === 1
          ? "tomorrow"
          : `in ${daysUntilExpiry} days`;

  return {
    // Auth-derived state
    isExpiringSoon,
    isExpired,
    daysUntilExpiry,
    isAuthLoading: isLoading,

    // UI state
    isDismissed,
    isRedirecting,
    shouldShow,

    // Computed display values
    daysText,

    // Handlers
    handlers: {
      handleDismiss,
      handleReconnect,
    },
  };
}
