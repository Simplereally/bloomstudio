"use client";

/**
 * useApiCardState Hook
 *
 * Manages state and handlers for the API settings card.
 * Now focused on BYOP (Bring Your Own Pollen) authentication.
 * Legacy Convex-stored API key support maintained for backward compatibility.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { usePollenAuth } from "@/lib/pollen-auth";

/**
 * Connection type for display purposes
 */
export type ConnectionType = "byop" | "legacy" | null;

/**
 * Connection status for status badge rendering
 */
export type ConnectionStatus =
  | "loading"
  | "not-connected"
  | "expired"
  | "expiring-soon"
  | "byop-connected"
  | "legacy-active";

/**
 * Return type for useApiCardState hook
 */
export interface UseApiCardStateReturn {
  // Legacy API state (deprecated - for backward compatibility)
  legacyState: {
    savedKey: string | null | undefined;
    hasLegacyKey: boolean;
    isLegacyLoading: boolean;
  };

  // BYOP auth state
  byopState: {
    isConnected: boolean;
    isExpiringSoon: boolean;
    isExpired: boolean;
    daysUntilExpiry: number | null;
    isLoading: boolean;
  };

  // Combined state
  isConnected: boolean;
  isLoading: boolean;
  connectionType: ConnectionType;
  connectionStatus: ConnectionStatus;

  // Loading/action states
  actionState: {
    isRemoving: boolean;
    isRedirecting: boolean;
    showLegacySection: boolean;
    setShowLegacySection: (value: boolean) => void;
  };

  // Handlers
  handlers: {
    handleRemoveLegacyKey: () => Promise<void>;
    handleReconnect: () => void;
    handleDisconnect: () => void;
  };
}

/**
 * Hook for managing API card state.
 *
 * Primarily uses BYOP authentication state with legacy Convex-stored
 * API key support for backward compatibility during migration.
 *
 * @example
 * ```tsx
 * function ApiCard() {
 *   const { isConnected, connectionStatus, handlers } = useApiCardState();
 *
 *   return (
 *     <Card>
 *       <StatusBadge status={connectionStatus} />
 *       <Button onClick={handlers.handleReconnect}>Reconnect</Button>
 *     </Card>
 *   );
 * }
 * ```
 */
export function useApiCardState(): UseApiCardStateReturn {
  // Legacy Convex-stored key (deprecated - kept for backward compatibility)
  const savedKey = useQuery(api.users.getPollinationsApiKey);
  const removeApiKey = useMutation(api.users.removePollinationsApiKey);

  // BYOP auth state
  const {
    isAuthorized: isByopConnected,
    isExpiringSoon,
    isExpired,
    daysUntilExpiry,
    isLoading: isByopLoading,
    authorize,
    deauthorize,
  } = usePollenAuth();

  // Action states
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showLegacySection, setShowLegacySection] = useState(false);

  // Derived state
  const isLegacyLoading = savedKey === undefined;
  const hasLegacyKey =
    savedKey !== undefined && savedKey !== null && savedKey !== "";
  const isLoading = isLegacyLoading || isByopLoading;
  const isConnected = isByopConnected || hasLegacyKey;

  const connectionType: ConnectionType = isByopConnected
    ? "byop"
    : hasLegacyKey
      ? "legacy"
      : null;

  const connectionStatus: ConnectionStatus = useMemo(() => {
    if (isLoading) return "loading";
    // BYOP-specific expiry checks - only apply when using BYOP auth
    // Legacy connections should not be affected by BYOP token expiry state
    if (isByopConnected && isExpired) return "expired";
    if (!isConnected) return "not-connected";
    if (isByopConnected && isExpiringSoon && daysUntilExpiry !== null)
      return "expiring-soon";
    if (connectionType === "byop" && daysUntilExpiry !== null)
      return "byop-connected";
    return "legacy-active";
  }, [
    isLoading,
    isConnected,
    isByopConnected,
    isExpired,
    isExpiringSoon,
    daysUntilExpiry,
    connectionType,
  ]);

  // Handlers
  const handleRemoveLegacyKey = useCallback(async () => {
    setIsRemoving(true);
    try {
      await removeApiKey({});
      toast.success("Legacy API Key removed");
    } catch {
      toast.error("Failed to remove API Key");
    } finally {
      setIsRemoving(false);
    }
  }, [removeApiKey]);

  const handleReconnect = useCallback(() => {
    setIsRedirecting(true);
    authorize();
  }, [authorize]);

  const handleDisconnect = useCallback(() => {
    deauthorize();
    toast.success("Disconnected from Pollinations");
  }, [deauthorize]);

  return {
    // Legacy API state (deprecated)
    legacyState: {
      savedKey,
      hasLegacyKey,
      isLegacyLoading,
    },

    // BYOP auth state
    byopState: {
      isConnected: isByopConnected,
      isExpiringSoon,
      isExpired,
      daysUntilExpiry,
      isLoading: isByopLoading,
    },

    // Combined state
    isConnected,
    isLoading,
    connectionType,
    connectionStatus,

    // Loading/action states
    actionState: {
      isRemoving,
      isRedirecting,
      showLegacySection,
      setShowLegacySection,
    },

    // Handlers
    handlers: {
      handleRemoveLegacyKey,
      handleReconnect,
      handleDisconnect,
    },
  };
}
