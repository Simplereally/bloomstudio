"use client"

/**
 * useSubscriptionStatus Hook
 * 
 * Client-side hook for checking the user's subscription status.
 * Returns whether they're on Pro, in trial, or expired.
 */

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export type SubscriptionStatus = "pro" | "trial" | "expired"

export interface UseSubscriptionStatusReturn {
    /** The user's subscription status */
    status: SubscriptionStatus
    /** Whether the query is still loading */
    isLoading: boolean
    /** When the trial expires (only set for trial users) */
    trialExpiresAt?: number
    /** Time remaining in trial (ms), or undefined if not in trial */
    trialTimeRemaining?: number
    /** Whether the user can generate images */
    canGenerate: boolean
}

/**
 * Hook for checking the current user's subscription status.
 * 
 * @example
 * ```tsx
 * const { status, canGenerate, trialTimeRemaining } = useSubscriptionStatus()
 * 
 * if (!canGenerate) {
 *   return <UpgradePrompt />
 * }
 * 
 * if (status === "trial" && trialTimeRemaining) {
 *   const hoursLeft = Math.ceil(trialTimeRemaining / (1000 * 60 * 60))
 *   return <TrialBanner hoursLeft={hoursLeft} />
 * }
 * ```
 */
export function useSubscriptionStatus(): UseSubscriptionStatusReturn {
    const result = useQuery(api.stripe.getUserSubscriptionStatus)

    if (result === undefined) {
        return {
            status: "expired",
            isLoading: true,
            canGenerate: false,
        }
    }

    const now = Date.now()
    const trialTimeRemaining = result.trialExpiresAt
        ? Math.max(0, result.trialExpiresAt - now)
        : undefined

    return {
        status: result.status,
        isLoading: false,
        trialExpiresAt: result.trialExpiresAt,
        trialTimeRemaining,
        canGenerate: result.status === "pro" || result.status === "trial",
    }
}
