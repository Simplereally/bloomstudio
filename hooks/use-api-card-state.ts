"use client";

/**
 * useApiCardState Hook
 *
 * Manages state and handlers for the API settings card.
 * Handles both BYOP (Bring Your Own Pollen) and legacy API key connection states.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { encryptKey } from "@/app/settings/actions";
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
  // Legacy API state
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

  // Input state
  inputState: {
    inputKey: string;
    setInputKey: (value: string) => void;
    isVisible: boolean;
    setIsVisible: (value: boolean) => void;
    toggleVisibility: () => void;
  };

  // Loading/action states
  actionState: {
    isSaving: boolean;
    isRemoving: boolean;
    isRedirecting: boolean;
    showLegacySection: boolean;
    setShowLegacySection: (value: boolean) => void;
  };

  // Handlers
  handlers: {
    handleSave: () => Promise<void>;
    handleRemoveLegacyKey: () => Promise<void>;
    handleReconnect: () => void;
    handleDisconnect: () => void;
  };
}

/**
 * Hook for managing API card state.
 *
 * Combines BYOP authentication state with legacy Convex-stored API key management.
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
  // Legacy Convex-stored key
  const savedKey = useQuery(api.users.getPollinationsApiKey);
  const setApiKey = useMutation(api.users.setPollinationsApiKey);
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

  // Input state
  const [inputKey, setInputKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Action states
  const [isSaving, setIsSaving] = useState(false);
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
    // Check expired first - expired takes precedence over not-connected
    if (isExpired) return "expired";
    if (!isConnected) return "not-connected";
    if (isExpiringSoon && daysUntilExpiry !== null) return "expiring-soon";
    if (connectionType === "byop" && daysUntilExpiry !== null)
      return "byop-connected";
    return "legacy-active";
  }, [
    isLoading,
    isConnected,
    isExpired,
    isExpiringSoon,
    daysUntilExpiry,
    connectionType,
  ]);

  // Handlers
  const handleSave = useCallback(async () => {
    if (!inputKey.trim()) return;

    setIsSaving(true);
    try {
      // 1. Encrypt on server via Next.js Action
      const encrypted = await encryptKey(inputKey.trim());

      // 2. Save encrypted key to Convex
      await setApiKey({ encryptedApiKey: encrypted });

      toast.success("API Key saved successfully");
      setInputKey(""); // Clear input for security
    } catch (error) {
      toast.error("Failed to save API Key");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [inputKey, setApiKey]);

  const handleRemoveLegacyKey = useCallback(async () => {
    setIsRemoving(true);
    try {
      await removeApiKey({});
      toast.success("API Key removed");
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

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  return {
    // Legacy API state
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

    // Input state
    inputState: {
      inputKey,
      setInputKey,
      isVisible,
      setIsVisible,
      toggleVisibility,
    },

    // Loading/action states
    actionState: {
      isSaving,
      isRemoving,
      isRedirecting,
      showLegacySection,
      setShowLegacySection,
    },

    // Handlers
    handlers: {
      handleSave,
      handleRemoveLegacyKey,
      handleReconnect,
      handleDisconnect,
    },
  };
}
