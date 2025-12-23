/**
 * QueryClient Configuration
 *
 * Centralized QueryClient factory with optimized defaults for the application.
 * Following SRP: This module is solely responsible for QueryClient configuration.
 */

import { QueryClient, type QueryClientConfig } from "@tanstack/react-query"

/**
 * Default stale times for different query categories.
 * These can be overridden at the query level.
 */
export const STALE_TIMES = {
  /** Static data that rarely changes (models, config) */
  STATIC: 1000 * 60 * 60, // 1 hour
  /** Dynamic data that may change frequently */
  DYNAMIC: 1000 * 60 * 5, // 5 minutes
  /** Real-time data that should always be fresh */
  REALTIME: 0,
} as const

/**
 * Default cache times for different query categories.
 */
export const GC_TIMES = {
  /** Keep static data in cache longer */
  STATIC: 1000 * 60 * 60 * 24, // 24 hours
  /** Standard cache time for most queries */
  STANDARD: 1000 * 60 * 30, // 30 minutes
  /** Short cache for frequently changing data */
  SHORT: 1000 * 60 * 5, // 5 minutes
} as const

/**
 * Default QueryClient configuration optimized for this application.
 */
const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Prevent unnecessary background refetches
      staleTime: STALE_TIMES.DYNAMIC,
      // How long to keep unused data in cache
      gcTime: GC_TIMES.STANDARD,
      // Retry failed requests with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus by default (can be overridden per query)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: "always",
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
}

/**
 * Creates a new QueryClient instance with default configuration.
 * This should be called once per app lifecycle (or per request in SSR).
 */
export function createQueryClient(
  config?: Partial<QueryClientConfig>
): QueryClient {
  return new QueryClient({
    ...defaultQueryClientConfig,
    ...config,
    defaultOptions: {
      ...defaultQueryClientConfig.defaultOptions,
      ...config?.defaultOptions,
      queries: {
        ...defaultQueryClientConfig.defaultOptions?.queries,
        ...config?.defaultOptions?.queries,
      },
      mutations: {
        ...defaultQueryClientConfig.defaultOptions?.mutations,
        ...config?.defaultOptions?.mutations,
      },
    },
  })
}

/**
 * Singleton QueryClient for use in the browser.
 * In Next.js, this ensures we don't create a new client on every render.
 */
let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  // Server: always create a new QueryClient
  if (typeof window === "undefined") {
    return createQueryClient()
  }

  // Browser: use singleton pattern
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }

  return browserQueryClient
}
