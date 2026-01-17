"use client";

/**
 * Reconnect Modal
 *
 * A modal that prompts re-authorization when the user's BYOP API key
 * has become invalid (detected via 401 response from Pollinations API).
 *
 * Note: This modal is now triggered by `needsReconnect` state (set by API error detection)
 * rather than local expiry tracking, since Pollinations doesn't provide expiry info.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConnectButton } from "./connect-button";
import { AlertTriangle } from "lucide-react";

export interface ReconnectModalProps {
  /** Whether the modal should be open */
  open: boolean;
  /** Callback when modal requests to close */
  onOpenChange: (open: boolean) => void;
}

/**
 * A modal that appears when the user's API key has become invalid.
 * Cannot be dismissed until the user reconnects.
 *
 * Note: This modal does NOT block navigation - it only prevents dismissal.
 * Apps should still function in a degraded mode when this is shown.
 *
 * @example
 * ```tsx
 * const [needsReconnect, setNeedsReconnect] = useState(false);
 *
 * // On 401 from Pollinations API:
 * // setNeedsReconnect(true);
 *
 * <ReconnectModal
 *   open={needsReconnect}
 *   onOpenChange={setNeedsReconnect}
 * />
 * ```
 */
export function ReconnectModal({ open, onOpenChange }: ReconnectModalProps) {
  // Handle open change - prevent closing by clicking outside
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow programmatic closing (e.g., after successful reconnect)
    if (!newOpen) {
      // Prevent close - user must reconnect
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <DialogTitle className="text-xl">Connection Issue</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your Pollinations connection is no longer valid. This may happen if
            your key expired or was revoked. Reconnect to continue generating
            images and videos.
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
                Secure connection to Pollinations
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
