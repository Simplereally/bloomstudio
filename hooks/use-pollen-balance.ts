"use client";

/**
 * usePollenBalance Hook
 *
 * Fetches and manages the user's Pollinations balance using TanStack Query.
 * Provides balance data, loading/error states, and refresh functionality.
 *
 * @example
 * ```tsx
 * function BalanceDisplay() {
 *   const { formattedBalance, isLoading, isLowBalance, refetch } = usePollenBalance();
 *
 *   if (isLoading) return <Skeleton />;
 *   return (
 *     <div className={isLowBalance ? "text-warning" : ""}>
 *       Balance: {formattedBalance}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePollenAuth } from "@/lib/pollen-auth";
import {
  fetchPollenBalance,
  isBalanceError,
  type BalanceError,
} from "@/lib/pollen-auth/balance-service";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/query";

/**
 * Default threshold for low balance warning (in pollen units)
 * Set to 1 because we can't infer max balance from the API - users can top up
 * via Polar.sh at any time. 0.5 pollen means they're genuinely running low.
 */
export const DEFAULT_LOW_BALANCE_THRESHOLD = 0.5;

/**
 * Minimum interval between balance refreshes (in milliseconds)
 * Prevents excessive API calls during rapid generation events
 */
export const MIN_REFRESH_INTERVAL_MS = 5000; // 5 seconds

/**
 * Return type for the usePollenBalance hook
 */
export interface UsePollenBalanceReturn {
  /** Current balance value (null if not loaded) */
  balance: number | null;
  /** Formatted balance string for display */
  formattedBalance: string | null;
  /** Whether balance is currently being fetched */
  isLoading: boolean;
  /** Whether there was an error fetching balance */
  isError: boolean;
  /** Error details if fetch failed */
  error: BalanceError | null;
  /** Whether balance is considered low (below threshold) */
  isLowBalance: boolean;
  /** Manually trigger a balance refresh */
  refetch: () => void;
  /** Invalidate and refetch balance (for post-generation) */
  invalidateBalance: () => void;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
}

/**
 * Formats a balance value for display with exactly 2 decimal places
 *
 * @param balance - The numeric balance value
 * @returns Formatted string with 2 decimal places (e.g., "123.45", "0.00")
 */
export function formatBalance(balance: number | null | undefined): string | null {
  if (balance === null || balance === undefined) {
    return null;
  }
  return balance.toFixed(2);
}

/**
 * Checks if a balance is below the low balance threshold
 *
 * @param balance - The numeric balance value
 * @param threshold - The threshold below which balance is considered low
 * @returns true if balance is below threshold, false otherwise
 */
export function isLowBalance(
  balance: number | null | undefined,
  threshold: number = DEFAULT_LOW_BALANCE_THRESHOLD
): boolean {
  if (balance === null || balance === undefined) {
    return false;
  }
  return balance < threshold;
}

/**
 * Hook for fetching and managing the user's Pollinations balance.
 *
 * Features:
 * - Automatic fetching when user is authorized
 * - Infinite retry with exponential backoff for retryable errors
 * - No retry for auth errors (401, 403)
 * - Debounced invalidation to prevent excessive API calls
 * - Low balance threshold detection
 *
 * @param options - Optional configuration
 * @param options.lowBalanceThreshold - Custom threshold for low balance warning
 * @returns Balance state and actions
 */
export function usePollenBalance(options?: {
  lowBalanceThreshold?: number;
}): UsePollenBalanceReturn {
  const { lowBalanceThreshold = DEFAULT_LOW_BALANCE_THRESHOLD } = options ?? {};

  const { apiKey, isAuthorized, isLoading: authLoading } = usePollenAuth();
  const queryClient = useQueryClient();

  // Track last refresh time for debouncing
  const lastRefreshRef = useRef<number>(0);

  const {
    data,
    isLoading: queryLoading,
    isError,
    error: queryError,
    refetch: queryRefetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.pollen.balance(),
    queryFn: () => fetchPollenBalance(apiKey!),
    enabled: isAuthorized && !!apiKey && !authLoading,
    staleTime: STALE_TIMES.DYNAMIC, // 5 minutes
    gcTime: GC_TIMES.SHORT, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: (failureCount, error) => {
      // Don't retry auth errors - requires user action
      if (isBalanceError(error)) {
        if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
          return false;
        }
      }
      // Retry forever for retryable errors (network, unknown)
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 32s → 60s (capped)
      const delay = Math.min(1000 * Math.pow(2, attemptIndex), 60000);
      return delay;
    },
  });

  // Extract balance error with proper typing
  const error: BalanceError | null = useMemo(() => {
    if (!queryError) return null;
    if (isBalanceError(queryError)) return queryError;
    return {
      code: "UNKNOWN_ERROR" as const,
      message: queryError instanceof Error ? queryError.message : "Unknown error",
    };
  }, [queryError]);

  // Manual refetch handler
  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  // Debounced invalidation for post-generation refresh
  const invalidateBalance = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;

    // Only invalidate if enough time has passed since last refresh
    if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL_MS) {
      lastRefreshRef.current = now;
      queryClient.invalidateQueries({ queryKey: queryKeys.pollen.balance() });
    }
  }, [queryClient]);

  // Compute derived values
  const balance = data?.balance ?? null;
  const formattedBalance = formatBalance(balance);
  const isLow = isLowBalance(balance, lowBalanceThreshold);

  // Loading state: either auth is loading or query is loading (but only if enabled)
  const isLoading = authLoading || (isAuthorized && queryLoading);

  return useMemo(
    () => ({
      balance,
      formattedBalance,
      isLoading,
      isError,
      error,
      isLowBalance: isLow,
      refetch,
      invalidateBalance,
      isRefreshing: isFetching,
    }),
    [
      balance,
      formattedBalance,
      isLoading,
      isError,
      error,
      isLow,
      refetch,
      invalidateBalance,
      isFetching,
    ]
  );
}
