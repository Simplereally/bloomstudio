"use client";

/**
 * API Key Onboarding Modal
 *
 * A sleek onboarding flow for users to connect their Pollinations BYOP account.
 * Shows automatically when an authenticated user doesn't have a valid connection.
 *
 * Uses BYOP OAuth flow for one-click setup.
 */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConvexAuth, useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Zap } from "lucide-react";
import * as React from "react";
import { usePollenAuth } from "@/lib/pollen-auth";
import { ConnectButton } from "@/components/pollen-auth";
import { api } from "@/convex/_generated/api";

type ApiKeyOnboardingPage = "setup" | "upgrade";

interface ApiKeyOnboardingModalProps {
  /** Callback when onboarding is complete */
  onComplete?: () => void;
  /** Force open state for testing (overrides automatic behavior) */
  forceOpen?: boolean;
  /** Callback when modal is closed (for controlled mode) */
  onClose?: () => void;
}

/**
 * Modal for guiding users through the Pollinations connection process.
 * Uses BYOP OAuth for one-click setup.
 */
export function ApiKeyOnboardingModal({
  onComplete,
  forceOpen,
  onClose,
}: ApiKeyOnboardingModalProps) {
  const [isOpenInternal, setIsOpenInternal] = React.useState(false);
  const [page, setPage] = React.useState<ApiKeyOnboardingPage>("setup");

  const shouldShowPreviewButton = process.env.NODE_ENV !== "production";

  // BYOP auth state - single source of truth for connection status
  // needsReconnect is used to defer to GlobalReconnectModal when key is invalid
  const { isAuthorized, isLoading: isByopLoading, needsReconnect } = usePollenAuth();

  // Controlled mode: forceOpen prop overrides internal state
  const isControlled = forceOpen !== undefined;
  const isOpen = isControlled ? forceOpen : isOpenInternal;

  // Clerk auth state
  const { isAuthenticated, isLoading: isLoadingAuth } = useConvexAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  // Initialize user on mount (only in automatic mode)
  React.useEffect(() => {
    if (isControlled || isLoadingAuth || !isAuthenticated) return;

    getOrCreateUser().catch((error) => {
      console.error("Error initializing user:", error);
    });
  }, [isAuthenticated, isLoadingAuth, isControlled, getOrCreateUser]);

  // Show/hide modal based on auth state (only in automatic mode)
  React.useEffect(() => {
    if (isControlled) return;

    // Don't show while loading
    if (isLoadingAuth || !isAuthenticated || isByopLoading) {
      setIsOpenInternal(false);
      return;
    }

    // If needsReconnect is true, defer to GlobalReconnectModal instead
    // This prevents showing two overlapping modals
    if (needsReconnect) {
      setIsOpenInternal(false);
      return;
    }

    // Show modal if not authorized, hide if authorized (and on setup page)
    if (!isAuthorized) {
      setIsOpenInternal(true);
    } else if (page === "setup") {
      setIsOpenInternal(false);
    }
  }, [
    isAuthenticated,
    isLoadingAuth,
    isControlled,
    page,
    isAuthorized,
    isByopLoading,
    needsReconnect,
  ]);

  const handleClose = React.useCallback(() => {
    setPage("setup");

    if (isControlled) {
      onClose?.();
    } else {
      setIsOpenInternal(false);
    }
  }, [isControlled, onClose]);

  const handleFinish = React.useCallback(() => {
    handleClose();
    onComplete?.();
  }, [handleClose, onComplete]);

  const handlePreviewUpgrade = React.useCallback(() => {
    setPage("upgrade");
  }, []);

  // In automatic mode: don't render while loading or if user is authorized
  if (!isControlled && (isByopLoading || (isAuthorized && !isOpenInternal))) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-[480px] p-0 border border-border/50 bg-card overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Connect to Pollinations</DialogTitle>
          <DialogDescription className="sr-only">
            One-click setup to connect your Pollinations account for free image generation.
          </DialogDescription>
        </DialogHeader>
        {/* Subtle accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent z-10" />

        <AnimatePresence mode="wait" initial={false}>
          {page === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SetupFace
                shouldShowPreviewButton={shouldShowPreviewButton}
                onPreviewUpgrade={handlePreviewUpgrade}
              />
            </motion.div>
          ) : (
            <motion.div
              key="upgrade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <UpgradeFace onFinish={handleFinish} />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

interface SetupFaceProps {
  shouldShowPreviewButton: boolean;
  onPreviewUpgrade: () => void;
}

function SetupFace({
  shouldShowPreviewButton,
  onPreviewUpgrade,
}: SetupFaceProps) {
  return (
    <div className="relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-3">
          <Zap className="w-3 h-3 fill-current" />
          Zero API Costs
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Connect to Pollinations
        </h2>
        <p className="text-sm text-muted-foreground">
          One-click setup. Generate unlimited images for free.
        </p>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 space-y-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-5">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Connect with your Pollinations account
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to Pollinations to authorize access.
                Returns automatically.
              </p>
            </div>

            <ConnectButton size="lg" className="w-full" icon="external">
              Connect with Pollinations
            </ConnectButton>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                Free
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                30-day authorization
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-muted/20 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          Your connection is secure and renews every 30 days.
        </p>
      </div>

      {/* Dev-only preview button */}
      {shouldShowPreviewButton && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1 pointer-events-none">
          <Button
            onClick={onPreviewUpgrade}
            variant="ghost"
            size="sm"
            className="text-[10px] opacity-20 hover:opacity-100 pointer-events-auto"
            type="button"
          >
            Preview upgrade
          </Button>
        </div>
      )}
    </div>
  );
}

interface UpgradeFaceProps {
  onFinish: () => void;
}

function UpgradeFace({ onFinish }: UpgradeFaceProps) {
  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-3">
          <Check className="w-3 h-3" />
          Connected
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          GitHub Developer Bonus
        </h2>
        <p className="text-sm text-muted-foreground max-w-[340px] mx-auto">
          Did you know that if you have a developer account on GitHub, you may
          receive 3x limits through Pollinations automatically? See{" "}
          <a
            href="https://enter.pollinations.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            enter.pollinations.ai
          </a>{" "}
          for more details if you&apos;re interested.
        </p>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 space-y-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-5">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500">
              <Zap className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">Increased Quota</p>
              <p className="text-sm text-muted-foreground">
                Active GitHub developers receive{" "}
                <span className="font-semibold text-foreground">3× limits</span>{" "}
                through Pollinations.
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              <div className="text-center">
                <div className="text-lg font-bold text-muted-foreground tabular-nums">
                  180
                </div>
                <div className="text-[10px] text-muted-foreground">base/mo</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-500 tabular-nums">
                  540
                </div>
                <div className="text-[10px] text-muted-foreground">
                  active dev/mo
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Based on your GitHub activity. Applied automatically.
            </p>
          </div>
        </div>

        <Button onClick={onFinish} variant="default" className="w-full">
          Continue to Studio
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-muted/20 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">Powered by Pollinations</p>
      </div>
    </div>
  );
}
