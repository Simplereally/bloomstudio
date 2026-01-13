"use client";

/**
 * Expiry Banner
 *
 * A banner component that warns users when their BYOP API key is expiring soon.
 * Displays only when `isExpiringSoon` is true (within 7 days of expiration).
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useExpiryBannerState } from "@/hooks/use-expiry-banner-state";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

export interface ExpiryBannerProps {
  /** Additional class names */
  className?: string;
  /** Whether to allow dismissing the banner */
  dismissible?: boolean;
  /** Storage key for dismissed state persistence */
  storageKey?: string;
}

/**
 * A banner that appears when the user's BYOP key is about to expire.
 * Shows days remaining and provides a quick reconnect action.
 *
 * @example
 * ```tsx
 * // In a layout or page
 * <ExpiryBanner />
 *
 * // Non-dismissible (e.g., for critical paths)
 * <ExpiryBanner dismissible={false} />
 * ```
 */
export function ExpiryBanner({
  className,
  dismissible = true,
  storageKey = "pollen_expiry_banner_dismissed",
}: ExpiryBannerProps) {
  const {
    isExpired,
    shouldShow,
    daysText,
    isRedirecting,
    handlers,
  } = useExpiryBannerState({ storageKey, dismissible });

  if (!shouldShow) {
    return null;
  }

  const isExpiredState = isExpired;

  return (
    <Alert
      variant={isExpiredState ? "destructive" : "default"}
      className={cn(
        "relative border-l-4",
        isExpiredState
          ? "border-l-destructive bg-destructive/5"
          : "border-l-amber-500 bg-amber-500/5",
        className
      )}
    >
      <AlertTriangle
        className={cn(
          "h-4 w-4",
          isExpiredState ? "text-destructive" : "text-amber-500"
        )}
      />
      <AlertTitle
        className={cn(isExpiredState ? "text-destructive" : "text-amber-600")}
      >
        {isExpiredState
          ? "Connection Expired"
          : "Pollinations Connection Expiring Soon"}
      </AlertTitle>
      <AlertDescription
        className={cn(
          "flex items-center justify-between gap-4 mt-2",
          isExpiredState ? "text-destructive/80" : "text-amber-600/80"
        )}
      >
        <span>
          {isExpiredState
            ? "Your Pollinations connection has expired. Reconnect to continue generating."
            : `Your connection expires ${daysText}. Reconnect now to avoid interruption.`}
        </span>
        <Button
          size="sm"
          variant={isExpiredState ? "destructive" : "outline"}
          onClick={handlers.handleReconnect}
          disabled={isRedirecting}
          className={cn(
            "shrink-0",
            !isExpiredState &&
              "border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
          )}
        >
          {isRedirecting ? (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          )}
          Reconnect
        </Button>
      </AlertDescription>

      {dismissible && !isExpiredState && (
        <button
          onClick={handlers.handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </Alert>
  );
}
