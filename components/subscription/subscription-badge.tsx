"use client"

import { useState, useCallback } from "react"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { SubscriptionBadgeView } from "./subscription-badge-view"

/**
 * SubscriptionBadge - Container component for the user's subscription tier.
 * Logic is handled by useSubscriptionStatus, rendering by SubscriptionBadgeView.
 */
export function SubscriptionBadge() {
    const { status, isLoading, timeLeft } = useSubscriptionStatus()
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    const handleUpgradeClick = useCallback(() => {
        setIsUpgradeModalOpen(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setIsUpgradeModalOpen(false)
    }, [])

    return (
        <SubscriptionBadgeView
            status={status}
            isLoading={isLoading}
            timeLeft={timeLeft}
            isUpgradeModalOpen={isUpgradeModalOpen}
            onUpgradeClick={handleUpgradeClick}
            onCloseUpgradeModal={handleCloseModal}
        />
    )
}
