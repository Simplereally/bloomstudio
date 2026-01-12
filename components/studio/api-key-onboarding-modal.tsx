"use client";

/**
 * API Key Onboarding Modal
 *
 * A sleek onboarding flow for users to connect their Pollinations BYOP account.
 * Shows automatically when an authenticated user doesn't have a valid connection.
 * 
 * Refactored for BYOP OAuth flow - primary action is now "Connect with Pollinations"
 * with a manual entry fallback for advanced users.
 */
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, ChevronUp, ExternalLink, Loader2, Save, Star, Zap } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import GitHubStarButton from "@/components/github-star-button";
import { usePollenAuth } from "@/lib/pollen-auth";
import { ConnectButton } from "@/components/pollen-auth";
import { api } from "@/convex/_generated/api";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
 *
 * Primary flow uses BYOP OAuth for one-click setup.
 * Includes a hidden manual entry fallback for advanced users.
 */
export function ApiKeyOnboardingModal({ onComplete, forceOpen, onClose }: ApiKeyOnboardingModalProps) {
  const [apiKey, setApiKey] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isOpenInternal, setIsOpenInternal] = React.useState(false);
  const [page, setPage] = React.useState<ApiKeyOnboardingPage>("setup");
  const [isFlipActive, setIsFlipActive] = React.useState(false);
  const [flipRotationDeg, setFlipRotationDeg] = React.useState(0);
  const [flipHeightPx, setFlipHeightPx] = React.useState<number | null>(null);
  const [showManualEntry, setShowManualEntry] = React.useState(false);
  const flipTimeoutRef = React.useRef<number | undefined>(undefined);
  const shouldReduceMotion = useReducedMotion();

  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const contentSize = useElementSize(contentRef);
  const upgradeMeasureRef = React.useRef<HTMLDivElement | null>(null);
  const upgradeHeight = useElementHeight(upgradeMeasureRef);
  const flipDurationMs = shouldReduceMotion ? 0 : 700;

  const shouldShowPreviewButton = process.env.NODE_ENV !== "production";

  // BYOP auth state
  const { isAuthorized: isByopAuthorized, isLoading: isByopLoading } = usePollenAuth();

  // Controlled mode: forceOpen prop overrides internal state
  const isControlled = forceOpen !== undefined;
  const isOpen = isControlled ? forceOpen : isOpenInternal;

  // Check if user has an API key (legacy Convex-stored key)
  const { isAuthenticated, isLoading: isLoadingAuth } = useConvexAuth();
  const existingApiKey = useQuery(api.users.getPollinationsApiKey, isAuthenticated ? {} : "skip");
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  // Use ref to avoid dependency array issues with Convex mutations
  const getOrCreateUserRef = React.useRef(getOrCreateUser);
  React.useEffect(() => {
    getOrCreateUserRef.current = getOrCreateUser;
  }, [getOrCreateUser]);

  // Initialize user on mount and show modal if no API key (only in automatic mode)
  React.useEffect(() => {
    if (isControlled) return; // Skip in controlled mode
    if (isLoadingAuth || !isAuthenticated) return;

    const initUser = async () => {
      try {
        await getOrCreateUserRef.current();
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };
    initUser();
  }, [isAuthenticated, isLoadingAuth, isControlled]);

  // Show modal if user doesn't have ANY valid key (BYOP or legacy)
  // Close modal if either auth method is successful
  React.useEffect(() => {
    if (isControlled) return; // Skip in controlled mode

    if (isLoadingAuth || !isAuthenticated || isByopLoading) {
      setIsOpenInternal(false);
      return;
    }

    // Has BYOP auth OR has legacy key?
    const hasValidAuth = isByopAuthorized || (existingApiKey !== null && existingApiKey !== undefined);

    if (!hasValidAuth) {
      setIsOpenInternal(true);
    } else if (page === "setup") {
      setIsOpenInternal(false);
    }
  }, [existingApiKey, isAuthenticated, isLoadingAuth, isControlled, page, isByopAuthorized, isByopLoading]);

  React.useEffect(() => {
    return () => {
      if (flipTimeoutRef.current !== undefined) {
        window.clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  const startFlipToUpgrade = React.useCallback(() => {
    if (page === "upgrade") return;

    if (shouldReduceMotion) {
      setPage("upgrade");
      return;
    }

    if (flipTimeoutRef.current !== undefined) {
      window.clearTimeout(flipTimeoutRef.current);
    }

    setIsFlipActive(true);
    setFlipRotationDeg(0);

    const currentHeight = contentRef.current?.getBoundingClientRect().height;
    if (currentHeight) {
      setFlipHeightPx(currentHeight);
    }

    setPage("upgrade");

    window.requestAnimationFrame(() => {
      setFlipRotationDeg(180);
      if (upgradeHeight) {
        setFlipHeightPx(upgradeHeight);
      }
    });

    flipTimeoutRef.current = window.setTimeout(() => {
      setIsFlipActive(false);
      flipTimeoutRef.current = undefined;
      setFlipHeightPx(null);
    }, flipDurationMs);
  }, [flipDurationMs, page, shouldReduceMotion, upgradeHeight]);

  const handleClose = React.useCallback(() => {
    setValidationError(null);
    setApiKey("");
    setIsSaving(false);
    setPage("setup");
    setIsFlipActive(false);
    setFlipRotationDeg(0);
    setFlipHeightPx(null);
    setShowManualEntry(false);

    if (flipTimeoutRef.current !== undefined) {
      window.clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = undefined;
    }

    if (isControlled) {
      onClose?.();
      return;
    }

    setIsOpenInternal(false);
  }, [isControlled, onClose]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationError("Please enter your API key");
      return;
    }

    if (!apiKey.trim().startsWith("sk_")) {
      setValidationError('This doesn\'t look right. Make sure you generated a "Secret Key" on the Pollinations site.');
      return;
    }

    setValidationError(null);

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      toast.success("API key saved successfully!");
      startFlipToUpgrade();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    handleClose();
    onComplete?.();
  };

  // In automatic mode: don't render if still loading or user has valid auth
  // In controlled mode: always render (visibility controlled by forceOpen prop)
  const hasValidAuth = isByopAuthorized || (existingApiKey !== null && existingApiKey !== undefined);
  if (!isControlled && (existingApiKey === undefined || isByopLoading || (hasValidAuth && !isOpenInternal))) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogTitle className="sr-only">Connect to Pollinations</DialogTitle>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border border-border/50 bg-card" showCloseButton={false}>
        {/* Subtle accent line at top (shared design with UpgradeModal) */}
        <div className="absolute top-0 left-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent z-10" />

        <motion.div
          ref={contentRef}
          initial={false}
          animate={isFlipActive && flipHeightPx ? { height: flipHeightPx } : {}}
          transition={{ duration: flipDurationMs / 1000, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative overflow-hidden"
        >
          {isFlipActive ? (
            <div className="[perspective:1200px]">
              <div
                className="relative [transform-style:preserve-3d]"
                style={{
                  transform: `rotateY(${flipRotationDeg}deg)`,
                  transitionProperty: "transform",
                  transitionDuration: `${flipDurationMs}ms`,
                  transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
                }}
              >
                <div className="[backface-visibility:hidden]">
                  <SetupFace
                    apiKey={apiKey}
                    isSaving={isSaving}
                    validationError={validationError}
                    shouldShowPreviewButton={shouldShowPreviewButton}
                    showManualEntry={showManualEntry}
                    onApiKeyChange={(nextApiKey) => {
                      setApiKey(nextApiKey);
                      setValidationError(null);
                    }}
                    onPreviewUpgrade={startFlipToUpgrade}
                    onToggleManualEntry={() => setShowManualEntry(!showManualEntry)}
                    onSaveApiKey={handleSaveApiKey}
                  />
                </div>
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <UpgradeFace onFinish={handleFinish} />
                </div>
              </div>
            </div>
          ) : page === "setup" ? (
            <SetupFace
              apiKey={apiKey}
              isSaving={isSaving}
              validationError={validationError}
              shouldShowPreviewButton={shouldShowPreviewButton}
              showManualEntry={showManualEntry}
              onApiKeyChange={(nextApiKey) => {
                setApiKey(nextApiKey);
                setValidationError(null);
              }}
              onPreviewUpgrade={startFlipToUpgrade}
              onToggleManualEntry={() => setShowManualEntry(!showManualEntry)}
              onSaveApiKey={handleSaveApiKey}
            />
          ) : (
            <UpgradeFace onFinish={handleFinish} />
          )}
        </motion.div>

        <div className="absolute left-[-9999px] top-0 opacity-0 pointer-events-none" style={{ width: contentSize?.width ?? 480 }}>
          <div ref={upgradeMeasureRef}>
            <UpgradeFace onFinish={() => undefined} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ElementSize {
  width: number;
  height: number;
}

function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState<ElementSize | null>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function useElementHeight(ref: React.RefObject<HTMLElement | null>) {
  const [height, setHeight] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setHeight(el.getBoundingClientRect().height);
    }

    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);

  return height;
}

interface SetupFaceProps {
  apiKey: string;
  isSaving: boolean;
  validationError: string | null;
  shouldShowPreviewButton: boolean;
  showManualEntry: boolean;
  onApiKeyChange: (nextApiKey: string) => void;
  onPreviewUpgrade: () => void;
  onToggleManualEntry: () => void;
  onSaveApiKey: () => void;
}

function SetupFace({
  apiKey,
  isSaving,
  validationError,
  shouldShowPreviewButton,
  showManualEntry,
  onApiKeyChange,
  onPreviewUpgrade,
  onToggleManualEntry,
  onSaveApiKey,
}: SetupFaceProps) {
  return (
    <>
      <div className="px-6 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-3">
          <Zap className="w-3 h-3 fill-current" />
          Zero API Costs
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-1">Connect to Pollinations</h2>
        <p className="text-sm text-muted-foreground">One-click setup. Generate unlimited images for free.</p>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* Primary action: BYOP OAuth Connect */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-5">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Connect with your Pollinations account</p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to Pollinations to authorize access. Returns automatically.
              </p>
            </div>

            <ConnectButton size="lg" className="w-full" icon="external">
              Connect with Pollinations
            </ConnectButton>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                Free forever
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                30-day authorization
              </span>
            </div>
          </div>
        </div>

        {/* Manual entry fallback - collapsible */}
        <Collapsible open={showManualEntry} onOpenChange={onToggleManualEntry}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {showManualEntry ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide manual entry
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Enter API key manually
                </>
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground mb-2">Get a free API key from Pollinations</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">
                        Go to{" "}
                        <a
                          href="https://enter.pollinations.ai/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          enter.pollinations.ai
                          <ExternalLink className="w-3 h-3 inline-block ml-0.5 align-[-2px]" />
                        </a>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">
                        Click <span className="font-medium text-foreground">&quot;Create API Key&quot;</span>, select{" "}
                        <span className="font-medium text-foreground">&quot;Secret Key&quot;</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">Copy the generated key</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/30 my-4" />

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground mb-3">Paste your API key here</p>

                  <Input
                    type="password"
                    placeholder="sk_xxx..."
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    className={`h-10 font-mono text-sm bg-background/50 ${validationError ? "border-destructive" : "border-border"}`}
                    autoComplete="off"
                    spellCheck={false}
                  />

                  {validationError && <p className="text-xs text-destructive mt-2">{validationError}</p>}

                  <Button onClick={onSaveApiKey} disabled={isSaving || !apiKey.trim()} className="w-full h-10 font-medium mt-3">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Continue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="px-6 py-3 bg-muted/20 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">Your connection is secure and renews every 30 days.</p>
        {shouldShowPreviewButton && (
          <Button onClick={onPreviewUpgrade} variant="ghost" size="sm" className="mt-2" disabled={isSaving} type="button">
            Preview upgrade screen
          </Button>
        )}
      </div>
    </>
  );
}

interface UpgradeFaceProps {
  onFinish: () => void;
}

function UpgradeFace({ onFinish }: UpgradeFaceProps) {
  return (
    <>
      <div className="px-6 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <Check className="w-3 h-3" />
          Connected
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Increase your limits ⭐️</h2>
        <p className="text-sm text-muted-foreground max-w-[340px] mx-auto leading-relaxed">
          We highly recommend starring Pollinations to unlock higher usage limits for your account.
        </p>
      </div>

      <div className="px-6 pb-8 space-y-6 flex flex-col items-center">
        <div className="relative w-full">
          {/* Visual emphasis: Background glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-2xl blur-xl opacity-50" />

          <div className="relative rounded-xl border border-primary/20 bg-muted/30 p-8 w-full text-center flex flex-col items-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 ring-4 ring-primary/5">
              <Star className="w-6 h-6 fill-primary/20" />
            </div>

            <p className="text-lg font-semibold text-foreground mb-2">Star on GitHub</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-[300px]">
              Unlock up to <span className="font-bold text-foreground">900 images/month</span> just by starring the repository. It&apos;s
              free and takes 2 seconds.
            </p>

            <div className="flex flex-col items-center w-full">
              {/* The Star Button focus */}
              <GitHubStarButton />
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <Button onClick={onFinish} variant="default" size="lg" className="w-full h-12 font-semibold shadow-lg shadow-primary/10">
            Continue to Studio
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <button
            onClick={onFinish}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Maybe later
          </button>
        </div>
      </div>

      <div className="px-6 py-4 bg-muted/10 border-t border-border/30 text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Thank you for supporting open source</p>
      </div>
    </>
  );
}
