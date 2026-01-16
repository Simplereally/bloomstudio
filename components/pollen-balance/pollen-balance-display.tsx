"use client"

import { usePollenAuth } from "@/lib/pollen-auth"
import { usePollenBalance } from "@/hooks/use-pollen-balance"
import { PollenBalanceDisplayView } from "./pollen-balance-display-view"

/**
 * Container component for displaying the user's Pollen balance.
 * Handles authorization gating and wires up the balance hook to the view.
 *
 * Only renders when the user is authorized with a valid BYOP API key.
 * Balance updates automatically after generation events and on window focus.
 */
export function PollenBalanceDisplay() {
  const { isAuthorized, isLoading: authLoading } = usePollenAuth()
  const {
    formattedBalance,
    isLoading,
    isError,
    error,
    isLowBalance,
  } = usePollenBalance()

  // Don't render if not authorized (no BYOP key)
  // Also don't render while auth is still loading to prevent flash
  if (authLoading) {
    return null
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <PollenBalanceDisplayView
      formattedBalance={formattedBalance}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message}
      isLowBalance={isLowBalance}
    />
  )
}
