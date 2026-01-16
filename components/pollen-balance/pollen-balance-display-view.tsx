"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Coins, AlertTriangle, AlertCircle } from "lucide-react"
import { memo } from "react"

export interface PollenBalanceDisplayViewProps {
  /** Formatted balance string */
  formattedBalance: string | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  isError: boolean
  /** Error message to display */
  errorMessage?: string
  /** Low balance warning */
  isLowBalance: boolean
}

/**
 * Presentational component for displaying the user's Pollen balance.
 * Balance updates automatically after generation events and on window focus.
 */
export const PollenBalanceDisplayView = memo(function PollenBalanceDisplayView({
  formattedBalance,
  isLoading,
  isError,
  errorMessage,
  isLowBalance,
}: PollenBalanceDisplayViewProps) {
  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Skeleton className="h-5 w-20 rounded-full" data-testid="balance-skeleton" />
    )
  }

  // Error state
  if (isError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="border-destructive/50 bg-destructive/10 text-destructive font-medium px-2 py-0.5"
            data-testid="balance-error"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] p-3">
          <div className="space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              Balance Error
            </p>
            <p className="text-xs text-muted-foreground">
              {errorMessage || "Unable to fetch balance. Will retry automatically."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Success state - show balance
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "font-medium px-2 py-0.5",
            isLowBalance
              ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
          )}
          data-testid="balance-display"
        >
          {isLowBalance ? (
            <AlertTriangle className="w-3 h-3 mr-1" />
          ) : (
            <Coins className="w-3 h-3 mr-1" />
          )}
          {formattedBalance}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px] p-3">
        <div className="space-y-1">
          <p
            className={cn(
              "font-bold flex items-center gap-1.5",
              isLowBalance
                ? "text-amber-600 dark:text-amber-500"
                : "text-emerald-600 dark:text-emerald-500"
            )}
          >
            <Coins className="w-3.5 h-3.5" />
            Pollen Balance
          </p>
          <p className="text-xs text-muted-foreground">
            {isLowBalance
              ? "Your balance is running low. Consider topping up."
              : "Your current Pollinations account balance."}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
})
