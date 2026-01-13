"use client";

/**
 * Reconnect Modal
 *
 * A modal that forces re-authorization when the user's BYOP API key
 * has expired or been revoked. Cannot be dismissed without reconnecting.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectButton } from "./connect-button";
import { usePollenAuth } from "@/lib/pollen-auth";
import { AlertTriangle } from "lucide-react";

export interface ReconnectModalProps {
  /** Override automatic display behavior (for testing) */
  forceOpen?: boolean;
  /** Callback when modal closes (only available if expiration is resolved) */
  onClose?: () => void;
}

/**
 * A modal that appears when the user's API key has expired.
 * Cannot be dismissed until the user reconnects or auth is restored.
 *
 * Note: This modal does NOT block navigation - it only prevents dismissal.
 * Apps should still function in a degraded mode when this is shown.
 *
 * @example
 * ```tsx
 * // Auto-displays when key expires
 * <ReconnectModal />
 *
 * // Force open for testing
 * <ReconnectModal forceOpen={true} />
 * ```
 */
export function ReconnectModal({ forceOpen, onClose }: ReconnectModalProps) {
  const { isExpired, isAuthorized, isLoading } = usePollenAuth();

  // Determine if modal should be open
  // Show when expired AND NOT authorized (expired key exists but is no longer valid)
  const shouldShow = forceOpen ?? (isExpired && !isAuthorized && !isLoading);

  // Handle open change - only allow closing if issue is resolved
  const handleOpenChange = (open: boolean) => {
    if (!open && !isExpired && isAuthorized) {
      onClose?.();
    }
    // Otherwise, prevent closing
  };

  return (
    <Dialog open={shouldShow} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive/60 to-transparent" />

        <DialogHeader className="text-center pt-2">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Connection Expired</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your Pollinations connection has expired after 30 days. Reconnect to
            continue generating images and videos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Benefits reminder */}
          <div className="w-full space-y-2 px-4">
            <p className="text-sm font-medium text-center text-foreground/80">
              By reconnecting, you&apos;ll continue to enjoy:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Zero API costs for generating
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Full access to all models
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Secure, temporary 30-day connection
              </li>
            </ul>
          </div>

          {/* Connect button */}
          <ConnectButton size="lg" className="w-full px-4">
            Reconnect to Pollinations
          </ConnectButton>

          <p className="text-xs text-muted-foreground text-center max-w-sm">
            This will redirect you to Pollinations to authorize a new
            connection. You&apos;ll be returned here automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
