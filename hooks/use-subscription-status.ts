"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState, useEffect, useMemo } from "react"

export type SubscriptionStatus = "pro" | "trial" | "expired"

export interface UseSubscriptionStatusReturn {
    /** The user's subscription status */
    status: SubscriptionStatus | undefined
    /** Whether the query is still loading */
    isLoading: boolean
    /** When the trial expires (only set for trial users) */
    trialExpiresAt?: number
    /** Formatted time remaining string (e.g., "2h 30m") */
    timeLeft?: string
    /** Whether the user can generate images */
    canGenerate: boolean
}

/**
 * Hook for checking the current user's subscription status.
 * Handles trial timer logic internally for efficient re-renders.
 */
export function useSubscriptionStatus(): UseSubscriptionStatusReturn {
    const result = useQuery(api.stripe.getUserSubscriptionStatus)
    const [timeLeft, setTimeLeft] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (result?.status === "trial" && result.trialExpiresAt) {
            const updateTimer = () => {
                const now = Date.now()
                const diff = result.trialExpiresAt! - now

                if (diff <= 0) {
                    setTimeLeft("Expired")
                    return
                }

                const hours = Math.floor(diff / (60 * 60 * 1000))
                const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

                if (hours > 0) {
                    setTimeLeft(`${hours}h ${minutes}m`)
                } else {
                    setTimeLeft(`${minutes}m`)
                }
            }

            updateTimer()
            const interval = setInterval(updateTimer, 60000)
            return () => clearInterval(interval)
        }
    }, [result?.status, result?.trialExpiresAt])

    const status = result?.status
    const isLoading = result === undefined
    const canGenerate = status === "pro" || status === "trial"

    return useMemo(() => ({
        status,
        isLoading,
        trialExpiresAt: result?.trialExpiresAt,
        timeLeft: status === "trial" ? timeLeft : undefined,
        canGenerate,
    }), [status, isLoading, result?.trialExpiresAt, timeLeft, canGenerate])
}
