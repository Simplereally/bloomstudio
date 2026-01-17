"use client";

/**
 * useApiCardState Hook
 *
 * Manages state and handlers for the API settings card.
 * Uses BYOP (Bring Your Own Pollen) OAuth authentication.
 *
 * Note: Legacy API key support has been removed. BYOP OAuth is now
 * the only supported authentication method. Invalid/expired keys are
 * detected via 401 responses from the Pollinations API during generation.
 */

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { usePollenAuth } from "@/lib/pollen-auth";

/**
 * Connection status for status badge rendering.
 */
export type ConnectionStatus = "loading" | "not-connected" | "byop-connected";

/**
 * Return type for useApiCardState hook
 */
export interface UseApiCardStateReturn {
  // BYOP auth state
  byopState: {
    isConnected: boolean;
    isLoading: boolean;
  };

  // Combined state
  isConnected: boolean;
  isLoading: boolean;
  connectionStatus: ConnectionStatus;

  // Action states
  actionState: {
    isRedirecting: boolean;
  };

  // Handlers
  handlers: {
    handleReconnect: () => void;
    handleDisconnect: () => void;
  };
}

/**
 * Hook for managing API card state.
 *
 * Uses BYOP authentication for Pollinations API connection.
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
  // BYOP auth state
  const {
    isAuthorized: isByopConnected,
    isLoading: isByopLoading,
    authorize,
    deauthorize,
  } = usePollenAuth();

  // Action states
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Derived state
  const isLoading = isByopLoading;
  const isConnected = isByopConnected;

  const connectionStatus: ConnectionStatus = useMemo(() => {
    if (isLoading) return "loading";
    if (!isConnected) return "not-connected";
    return "byop-connected";
  }, [isLoading, isConnected]);

  // Handlers
  const handleReconnect = useCallback(() => {
    setIsRedirecting(true);
    authorize();
  }, [authorize]);

  const handleDisconnect = useCallback(() => {
    deauthorize();
    toast.success("Disconnected from Pollinations");
  }, [deauthorize]);

  return {
    // BYOP auth state
    byopState: {
      isConnected: isByopConnected,
      isLoading: isByopLoading,
    },

    // Combined state
    isConnected,
    isLoading,
    connectionStatus,

    // Action states
    actionState: {
      isRedirecting,
    },

    // Handlers
    handlers: {
      handleReconnect,
      handleDisconnect,
    },
  };
}
