/**
 * Query Module Barrel Export
 *
 * Central export point for all query-related utilities.
 */

// Query client factory and configuration
export {
    createQueryClient,
    getQueryClient,
    STALE_TIMES,
    GC_TIMES,
} from "./query-client"

// Query key factory
export { queryKeys, invalidationPatterns } from "./query-keys"
export type { QueryKeys } from "./query-keys"
