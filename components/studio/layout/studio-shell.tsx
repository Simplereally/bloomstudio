"use client";

/**
 * StudioShell - Modern refactored Studio layout component
 *
 * This component serves as the composition layer that brings together
 * all isolated features without managing their internal state.
 *
 * Architecture:
 * - Uses specialized hooks for each concern (prompt, generation, UI)
 * - Composes feature components instead of managing state directly
 * - Each feature is an isolated "bubble" that doesn't affect others
 *
 * Performance Benefits:
 * - Typing in prompt only affects prompt components
 * - Changing model only affects generation components
 * - UI state changes (panel toggles) don't trigger generation re-renders
 */

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BatchActionButton } from "@/components/studio/batch/batch-action-button";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

// Studio Components
import { ImageLightbox } from "@/components/images/image-lightbox";
import {
  ApiKeyOnboardingModal,
  BatchConfigButton,
  StudioLayout,
  UpgradeModal,
} from "@/components/studio";

// Feature Components
import { CanvasFeature } from "@/components/studio/features/canvas";
import {
  BatchModeContext,
  ControlsFeature,
  GenerationSettingsContext,
} from "@/components/studio/features/generation";
import { GalleryFeature } from "@/components/studio/features/history";
import {
  PromptFeature,
  PromptManagerContext,
} from "@/components/studio/features/prompt";

// Hooks
import { useGenerateImage } from "@/hooks/queries";
import { useImageHistory } from "@/hooks/queries/use-image-history";
import { useBatchMode } from "@/hooks/use-batch-mode";
import {
  useEstimatedCost,
  formatRemainingBalance,
} from "@/hooks/use-estimated-cost";
import { useGenerationSettings } from "@/hooks/use-generation-settings";
import { useImageGalleryState } from "@/hooks/use-image-gallery-state";
import { usePollenBalance } from "@/hooks/use-pollen-balance";
import { usePromptManager } from "@/hooks/use-prompt-manager";
import { useStudioUI } from "@/hooks/use-studio-ui";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { getModel, getModelSupportsNegativePrompt } from "@/lib/config/models";
import { showAuthRequiredToast, showErrorToast } from "@/lib/errors";
import type {
  GeneratedImage,
  ImageGenerationParams,
  VideoGenerationParams,
  VideoModel,
} from "@/types/pollinations";
import type { ThumbnailData } from "@/components/studio/gallery/image-gallery";
import type { PaginatedGalleryResult } from "@/components/studio/gallery/types";
import { useConvexAuth, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { invalidateUserHistoryCache } from "@/app/_server/actions/invalidation";
import { LowBalanceWarningDialog } from "@/components/pollen-balance/low-balance-warning-dialog";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import type { QueueItem } from "@/components/studio/canvas/image-canvas";


export interface StudioShellProps {
  defaultLayout?: Record<string, number>;
  /** Server-cached initial gallery page (reduces Convex bandwidth on initial load) */
  initialGalleryPage?: PaginatedGalleryResult;
}

/**
 * StudioShell - The main Studio composition component
 *
 * This component:
 * 1. Initializes all feature hooks at the top level
 * 2. Provides contexts for cross-feature communication
 * 3. Handles generation orchestration (combining prompt + settings)
 * 4. Renders the layout with composed features
 *
 * @example
 * ```tsx
 * <StudioShell defaultLayout={{ sidebar: 22, gallery: 18 }} />
 * ```
 */
export function StudioShell({
  defaultLayout,
  initialGalleryPage,
}: StudioShellProps) {
  // ========================================
  // Initialize Feature Hooks
  // ========================================
  const promptManager = usePromptManager();
  const generationSettings = useGenerationSettings();
  const studioUI = useStudioUI();
  const galleryState = useImageGalleryState();
  const isMobile = useIsMobile();

  // Authentication state for features requiring auth
  const { isAuthenticated: isSignedIn } = useConvexAuth();

  // URL params for handling post-upgrade redirect
  const searchParams = useSearchParams();

  // Upgrade modal state (shown when trial expires)
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // Prevent any scroll at the root level for fixed viewport pages like Studio
  React.useEffect(() => {
    document.body.setAttribute("data-fixed-viewport", "true");
    return () => {
      document.body.removeAttribute("data-fixed-viewport");
    };
  }, []);

  // Subscription status for post-upgrade verification
  const { status: subscriptionStatus } = useSubscriptionStatus();

  // Handle successful upgrade redirect
  React.useEffect(() => {
    const isUpgraded = searchParams.get("upgraded") === "true";

    // If we have the upgraded param but subscription isn't active yet, show loading state
    if (isUpgraded) {
      if (subscriptionStatus === "pro") {
        toast.dismiss("upgrade-loading");
        toast.success("Welcome to Pro!", {
          id: "upgrade-success", // Prevent duplicate toasts
          description: "Your account has been upgraded. Start creating!",
        });
        // Clean up URL without reload
        window.history.replaceState({}, "", "/studio");
      } else {
        // Still processing webhook or loading
        toast.loading("Finalizing your upgrade...", {
          id: "upgrade-loading",
          description: "Syncing your subscription status with Stripe.",
        });
      }
    }
  }, [searchParams, subscriptionStatus]);

  // Batch mode (depends on generation settings and gallery)
  const batchMode = useBatchMode({
    generateSeed: generationSettings.generateSeed,
    addImage: galleryState.addImage,
    onTrialExpired: () => setShowUpgradeModal(true),
  });

  // ========================================
  // Pollen Balance & Cost Estimation
  // ========================================
  const { balance, formattedBalance } = usePollenBalance();

  // Get batch count for cost estimation
  const batchCount = batchMode.batchSettings.enabled
    ? batchMode.batchSettings.count
    : 1;

  // Estimate cost based on current model and settings
  const { canAfford, willDepleteBalance, remainingAfter, formattedCost } =
    useEstimatedCost({
      modelId: generationSettings.model,
      balance,
      imageCount: batchCount,
      durationSeconds: generationSettings.videoSettings.duration,
    });

  // Low balance warning dialog state
  const [showLowBalanceWarning, setShowLowBalanceWarning] =
    React.useState(false);
  // Store pending generation params to execute after user confirms
  const pendingGenerationRef = React.useRef<(() => void) | null>(null);

  // Get model display name for dialog
  const currentModel = getModel(generationSettings.model);
  const modelDisplayName =
    currentModel?.displayName ?? generationSettings.model;

  // ========================================
  // Image Generation
  // ========================================
  const { generate, cancelGenerationById } = useGenerateImage({
    onSuccess: async (image) => {
      galleryState.addImage(image);
      generationSettings.refreshSeedIfNeeded();

      if (isSignedIn) {
        // Invalidate history cache so new image appears on history page
        await invalidateUserHistoryCache().catch(console.error);
      }
    },
    onError: (error) => {
      if (error.code === "UNAUTHORIZED") {
        showAuthRequiredToast();
        setShowUpgradeModal(true);
      } else if (error.code === "AUTH_ERROR") {
        // Handled globally by needsReconnect state - no toast needed
      } else if (error.code === "BUDGET_EXHAUSTED") {
        toast.error("Your Pollinations balance is exhausted", {
          description: "Please top up your pollen to continue generating.",
        });
      } else if (error.code === "MODEL_ACCESS_DENIED") {
        toast.error("Model access denied", {
          description:
            "You don't have permission to use this model. Try a different one.",
        });
      } else {
        showErrorToast(error);
      }
    },
  });

  // Active single generations (pending + processing) for queue UX
  const activeSingleGenerations = useQuery(
    api.singleGeneration.getActiveGenerations,
    isSignedIn ? {} : "skip",
  );

  const activeSingleList = React.useMemo(
    () => (Array.isArray(activeSingleGenerations) ? activeSingleGenerations : []),
    [activeSingleGenerations],
  );

  const getSingleGenerationDisplayStatus = React.useCallback(
    (
      generation: (typeof activeSingleList)[number],
    ): "pending" | "processing" => {
      if (
        generation.status === "processing" ||
        generation.dispatchStatus === "dispatched" ||
        generation.dispatchStatus === "processing"
      ) {
        return "processing";
      }

      return "pending";
    },
    [],
  );

  const singlePendingCount = React.useMemo(
    () =>
      activeSingleList.filter(
        (generation) =>
          getSingleGenerationDisplayStatus(generation) === "pending",
      ).length,
    [activeSingleList, getSingleGenerationDisplayStatus],
  );

  const singleActiveCount = activeSingleList.length;
  const singleIsActive = singleActiveCount > 0;

  // Derive structured queue items from active generations, sorted oldest-first
  const singleQueueItems: QueueItem[] = React.useMemo(() => {
    const sorted = [...activeSingleList].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    return sorted
      .filter(
        (g): g is typeof g & { status: "pending" | "processing" } =>
          g.status === "pending" || g.status === "processing",
      )
      .map((g, i) => {
        const w = g.generationParams?.width ?? 1024;
        const h = g.generationParams?.height ?? 1024;
        const aspectRatio = h > 0 ? w / h : 1;
        return {
          id: g._id,
          status: getSingleGenerationDisplayStatus(g),
          createdAt: g.createdAt,
          aspectRatio: Number.isFinite(aspectRatio) ? aspectRatio : 1,
          labelIndex: i + 1,
        };
      });
  }, [activeSingleList, getSingleGenerationDisplayStatus]);

  const handleCancelSingleItem = React.useCallback(
    async (id: string) => {
      try {
        await cancelGenerationById(id as Parameters<typeof cancelGenerationById>[0]);
      } catch (error) {
        console.error("Failed to cancel generation:", error);
        toast.error("Could not stop generation", {
          description: "Please try again.",
        });
      }
    },
    [cancelGenerationById],
  );

  // ========================================
  // Generation Handler
  // ========================================


  // Core generation logic (called directly or after warning confirmation)
  const executeGeneration = React.useCallback(() => {
    const { prompt, negativePrompt } = promptManager.getPromptValues();

    if (!prompt) return;

    // Add to history
    promptManager.addToPromptHistory(prompt);

    // Batch mode
    if (batchMode.batchSettings.enabled) {
      batchMode.startBatchGeneration(
        {
          prompt,
          negativePrompt: negativePrompt || undefined,
          model: generationSettings.model,
          width: generationSettings.width,
          height: generationSettings.height,
          seed:
            generationSettings.seed === -1
              ? undefined
              : generationSettings.seed,
           enhance: false,
           private: generationSettings.options.private,
           safe: generationSettings.options.safe,
           // For video models, use the first frame as the reference image (image-to-video);
           // for image models, use the standard reference image (image-to-image).
           image: generationSettings.isVideoModel
             ? (generationSettings.videoReferenceImages[0] || undefined)
             : generationSettings.referenceImage,
           // Video-specific parameters
           duration: generationSettings.videoSettings.duration,
           audio: generationSettings.videoSettings.audio,
           aspectRatio: generationSettings.aspectRatio,
            lastFrameImage: generationSettings.videoReferenceImages[1] || undefined,
          },
        batchMode.batchSettings.count,
      );
      return;
    }

    // Single image generation
    const effectiveSeed =
      generationSettings.seed === -1
        ? generationSettings.generateSeed()
        : generationSettings.seed;

    const commonParams = {
      prompt,
      negativePrompt: negativePrompt || undefined,
      model: generationSettings.model,
      width: generationSettings.width,
      height: generationSettings.height,
      seed: effectiveSeed,
      enhance: false,
      private: generationSettings.options.private,
      safe: generationSettings.options.safe,
      // For video models, use the first frame as the reference image (image-to-video);
      // for image models, use the standard reference image (image-to-image).
      image: generationSettings.isVideoModel
        ? (generationSettings.videoReferenceImages[0] || undefined)
        : generationSettings.referenceImage,
    };

    if (generationSettings.isVideoModel) {
      const videoAspectRatio =
        generationSettings.aspectRatio === "16:9" ||
        generationSettings.aspectRatio === "9:16"
          ? generationSettings.aspectRatio
          : undefined;

      // Safe cast: isVideoModel is derived from the model registry (modelDef.type === "video"),
      // which guarantees the model string is a valid VideoModel enum member.
      const params: VideoGenerationParams = {
        ...commonParams,
        model: generationSettings.model as VideoModel,
        duration: generationSettings.videoSettings.duration,
        audio: generationSettings.videoSettings.audio,
        aspectRatio: videoAspectRatio,
        lastFrameImage: generationSettings.videoReferenceImages[1] || undefined,
      };
      generate(params);
      return;
    }

    const params: ImageGenerationParams = commonParams;
    generate(params);
  }, [promptManager, generationSettings, batchMode, generate]);

  // Main click handler - checks balance before proceeding
  const handleGenerateClick = React.useCallback(() => {
    const { prompt } = promptManager.getPromptValues();

    if (!prompt) return;

    // Prevent generation if we're waiting for upgrade verification
    if (
      searchParams.get("upgraded") === "true" &&
      subscriptionStatus !== "pro"
    ) {
      toast.info("Please wait while we confirm your subscription...", {
        id: "upgrade-pending-block",
      });
      return;
    }

    // Check if we should show low balance warning
    // Show warning if: can't afford OR will deplete balance below threshold
    if (!canAfford || willDepleteBalance) {
      // Store the generation function to call after confirmation
      pendingGenerationRef.current = executeGeneration;
      setShowLowBalanceWarning(true);
      return;
    }

    // Balance is fine, proceed with generation
    executeGeneration();
  }, [
    promptManager,
    searchParams,
    subscriptionStatus,
    canAfford,
    willDepleteBalance,
    executeGeneration,
  ]);

  // Handle warning dialog confirmation
  const handleLowBalanceConfirm = React.useCallback(() => {
    setShowLowBalanceWarning(false);
    // Execute the pending generation
    if (pendingGenerationRef.current) {
      pendingGenerationRef.current();
      pendingGenerationRef.current = null;
    }
  }, []);

  // Handle warning dialog close/cancel
  const handleLowBalanceClose = React.useCallback(() => {
    setShowLowBalanceWarning(false);
    pendingGenerationRef.current = null;
  }, []);

  // ========================================
  // Keyboard Shortcut for Generation
  // ========================================
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerateClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerateClick]);

  // ========================================
  // Gallery Images for Reference Image Pickers
  // ========================================
  // Subscribe to image history directly so thumbnails are available immediately,
  // even on mobile where the history drawer (and its gallery component) is rendered
  // inside a portal that only mounts when the drawer is open.
  // Convex deduplicates identical query subscriptions, so when the gallery panel
  // is also mounted (desktop, or after opening the mobile drawer), there is no
  // extra bandwidth cost.
  const historyQuery = useImageHistory();

  /** Map raw Convex paginated results to the ThumbnailData shape expected by controls. */
  const baseGalleryImages: ThumbnailData[] = React.useMemo(
    () =>
      historyQuery.results.map((img) => {
        const id = String(img._id);
        return {
          id,
          _id: id,
          _creationTime: img._creationTime,
          url: img.url,
          originalUrl: img.originalUrl,
          visibility: img.visibility,
          model: img.model,
          contentType: img.contentType,
          prompt: "",
        };
      }),
    [historyQuery.results],
  );

  // When the gallery component is mounted (always on desktop; on mobile after the
  // history drawer opens) it may have loaded additional pages via "load more". We
  // store those extended results here so the reference image picker can show them
  // too. The callback is intentionally memoised with useCallback so that passing
  // it to GalleryFeature doesn't cause unnecessary re-renders.
  const [extendedGalleryImages, setExtendedGalleryImages] = React.useState<
    ThumbnailData[] | null
  >(null);
  const handleGalleryImagesLoaded = React.useCallback(
    (images: ThumbnailData[]) => {
      setExtendedGalleryImages(images);
    },
    [],
  );

  // Use the extended set from the gallery when available (it's a superset that
  // includes "load more" pages), otherwise fall back to the direct subscription
  // which provides at least the first page.
  const galleryImages =
    extendedGalleryImages && extendedGalleryImages.length > 0
      ? extendedGalleryImages
      : baseGalleryImages;

  const [lightboxUsesGalleryNavigation, setLightboxUsesGalleryNavigation] =
    React.useState(false);

  // ========================================
  // Gallery Image Selection Handler
  // ========================================
  const handleSelectGalleryImage = React.useCallback(
    (image: ThumbnailData) => {
      setLightboxUsesGalleryNavigation(true);
      studioUI.openLightbox(image);
    },
    [studioUI],
  );

  const currentLightboxGalleryIndex = React.useMemo(() => {
    if (!lightboxUsesGalleryNavigation || !studioUI.lightboxImage) {
      return -1;
    }

    const lightboxImageId =
      studioUI.lightboxImage._id ?? studioUI.lightboxImage.id ?? null;

    if (lightboxImageId) {
      return galleryImages.findIndex(
        (image) => image.id === lightboxImageId || image._id === lightboxImageId,
      );
    }

    const lightboxImageUrl =
      studioUI.lightboxImage.originalUrl ?? studioUI.lightboxImage.url;

    return galleryImages.findIndex(
      (image) =>
        image.originalUrl === lightboxImageUrl || image.url === lightboxImageUrl,
    );
  }, [galleryImages, lightboxUsesGalleryNavigation, studioUI.lightboxImage]);

  const handleNextLightboxMedia = React.useCallback(() => {
    const nextImage = galleryImages[currentLightboxGalleryIndex + 1];
    if (!nextImage) {
      return;
    }

    studioUI.setLightboxImage(nextImage);
  }, [currentLightboxGalleryIndex, galleryImages, studioUI]);

  const handlePreviousLightboxMedia = React.useCallback(() => {
    const previousImage = galleryImages[currentLightboxGalleryIndex - 1];
    if (!previousImage) {
      return;
    }

    studioUI.setLightboxImage(previousImage);
  }, [currentLightboxGalleryIndex, galleryImages, studioUI]);

  const lightboxMediaNavigation = React.useMemo(() => {
    if (!lightboxUsesGalleryNavigation || currentLightboxGalleryIndex < 0) {
      return undefined;
    }

    return {
      hasNext: currentLightboxGalleryIndex < galleryImages.length - 1,
      hasPrevious: currentLightboxGalleryIndex > 0,
      hideVideoControls: isMobile,
      nextImage: galleryImages[currentLightboxGalleryIndex + 1] ?? null,
      onNext: handleNextLightboxMedia,
      onPrevious: handlePreviousLightboxMedia,
      previousImage: galleryImages[currentLightboxGalleryIndex - 1] ?? null,
    };
  }, [
    currentLightboxGalleryIndex,
    galleryImages.length,
    handleNextLightboxMedia,
    handlePreviousLightboxMedia,
    isMobile,
    lightboxUsesGalleryNavigation,
  ]);

  const galleryActiveImageId =
    lightboxUsesGalleryNavigation && currentLightboxGalleryIndex >= 0
      ? galleryImages[currentLightboxGalleryIndex]?.id
      : galleryState.currentImage?.id;

  const handleCanvasLightboxOpen = React.useCallback(
    (image: GeneratedImage | null) => {
      setLightboxUsesGalleryNavigation(false);
      studioUI.openLightbox(image);
    },
    [studioUI],
  );

  const handleLightboxClose = React.useCallback(() => {
    setLightboxUsesGalleryNavigation(false);
    studioUI.closeLightbox();
  }, [studioUI]);

  // ========================================
  // Regenerate Handler
  // ========================================
  const handleRegenerate = React.useCallback(() => {
    if (galleryState.currentImage) {
      const image = galleryState.currentImage;
      promptManager.promptSectionRef.current?.setPrompt(image.prompt);
      promptManager.setHasPromptContent(true);
      // Trigger generation with same prompt
      generate({
        prompt: image.prompt,
        negativePrompt: image.params.negativePrompt,
        model: generationSettings.model,
        width: generationSettings.width,
        height: generationSettings.height,
        seed: generationSettings.generateSeed(),
        enhance: false,
        private: generationSettings.options.private,
        safe: generationSettings.options.safe,
      });
    }
  }, [galleryState, promptManager, generationSettings, generate]);

  // ========================================
  // Sidebar Scroll State (for fade overlays)
  // ========================================
  const scrollViewportRef = React.useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = React.useState(false);
  const [showBottomFade, setShowBottomFade] = React.useState(false);

  const updateScrollFades = React.useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasScrollableContent = scrollHeight > clientHeight;
    setShowTopFade(scrollTop > 8);
    setShowBottomFade(
      hasScrollableContent && scrollTop + clientHeight < scrollHeight - 8,
    );
  }, []);

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      updateScrollFades(e.currentTarget);
    },
    [updateScrollFades],
  );

  // Check initial scroll state on mount
  React.useEffect(() => {
    // Small delay to let content render
    const timer = setTimeout(() => {
      updateScrollFades(scrollViewportRef.current);
    }, 100);
    return () => clearTimeout(timer);
  }, [updateScrollFades]);

  // ========================================
  // Sidebar Content
  // ========================================
  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Top fade overlay */}
        <div
          className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: showTopFade ? 1 : 0,
            background:
              "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, transparent 100%)",
          }}
        />

        <ScrollArea
          className="h-full"
          onScroll={handleScroll}
          viewportRef={scrollViewportRef}
        >
          <div className="p-0 space-y-0.5 w-full min-w-0 overflow-x-hidden">
            {/* Prompt Feature */}
            <PromptManagerContext.Provider value={promptManager}>
              <PromptFeature

                showNegativePrompt={getModelSupportsNegativePrompt(
                  generationSettings.model,
                )}
                showLibrary={!!isSignedIn}
              />
            </PromptManagerContext.Provider>

            {/* Generation Controls Feature */}
            <GenerationSettingsContext.Provider value={generationSettings}>
              <BatchModeContext.Provider value={batchMode}>
                <ControlsFeature
                  isGenerating={batchMode.isBatchActive}
                  historyImages={galleryImages}
                />
              </BatchModeContext.Provider>
            </GenerationSettingsContext.Provider>
          </div>
        </ScrollArea>

        {/* Bottom fade overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none transition-opacity duration-200"
          style={{
            opacity: showBottomFade ? 1 : 0,
            background:
              "linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Generate / Pause / Resume Batch Button */}
      <div className="p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] border-t bg-background/60">
        {batchMode.isBatchActive ? (
          <BatchActionButton
            isPaused={batchMode.isBatchPaused}
            completedCount={batchMode.batchProgress.completedCount}
            totalCount={batchMode.batchProgress.totalCount}
            inFlightCount={batchMode.batchProgress.inFlightCount}
            onPause={batchMode.pauseBatchGeneration}
            onResume={batchMode.resumeBatchGeneration}
            onCancel={batchMode.cancelBatchGeneration}
          />
        ) : (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center gap-1.5 w-full">
              <Button
                onClick={handleGenerateClick}
                disabled={!promptManager.hasPromptContent}
                className="flex-1 h-11 text-base font-semibold"
                size="lg"
              >
                {batchMode.batchSettings.enabled ? (
                  <>Generate Batch ({batchMode.batchSettings.count})</>
                ) : (
                  <>Generate Image</>
                )}
              </Button>

              {isMobile && (
                <Separator orientation="vertical" className="h-8 bg-border/40 mx-0.5" />
              )}

              <BatchConfigButton
                settings={batchMode.batchSettings}
                onSettingsChange={batchMode.setBatchSettings}
                disabled={batchMode.isBatchActive}
                className={isMobile ? "w-14" : undefined}
              />
            </div>

            {/* Queue status indicator */}
            {singleActiveCount > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span>
                  {singleActiveCount} generation{singleActiveCount !== 1 ? "s" : ""} in progress
                  {singlePendingCount > 0 && <> ({singlePendingCount} queued)</>}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ========================================
  // Canvas Content
  // ========================================
  const canvasContent = (
    <CanvasFeature
      currentImage={galleryState.currentImage}
      isGenerating={singleIsActive || batchMode.isBatchActive}
      queueItems={singleQueueItems}
      onCancelItem={handleCancelSingleItem}

      progress={
        batchMode.isBatchActive
          ? batchMode.batchProgress.totalCount > 0
            ? (batchMode.batchProgress.completedCount /
                batchMode.batchProgress.totalCount) *
              100
            : 0
          : undefined
      }
      onOpenLightbox={handleCanvasLightboxOpen}
      onRegenerate={handleRegenerate}
    />
  );

  // ========================================
  // Gallery Content
  // ========================================
  const galleryContent = (
    <GalleryFeature
      activeImageId={galleryActiveImageId}
      onSelectImage={handleSelectGalleryImage}
      thumbnailSize="md"
      initialPage={initialGalleryPage}
      onImagesLoaded={handleGalleryImagesLoaded}
    />
  );

  // ========================================
  // Render
  // ========================================
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background overflow-hidden">
      {/* Main Layout */}
      <main className="flex-1 overflow-hidden">
        <StudioLayout
          sidebar={sidebarContent}
          canvas={canvasContent}
          gallery={galleryContent}
          showSidebar={studioUI.showLeftSidebar}
          showGallery={studioUI.showGallery}
          onSidebarOpenChange={studioUI.setShowLeftSidebar}
          onGalleryOpenChange={studioUI.setShowGallery}
          defaultSidebarSize="22%"
          defaultGallerySize="18%"
          defaultLayout={defaultLayout}
          // Mobile-specific props
          onGenerate={handleGenerateClick}
          isGenerating={singleIsActive}
          isGenerateDisabled={!promptManager.hasPromptContent}
          batchSettings={batchMode.batchSettings}
          isBatchActive={batchMode.isBatchActive}
        />
      </main>

      {/* API Key Onboarding Modal - shows when authenticated user doesn't have a key */}
      <ApiKeyOnboardingModal />

      {/* Upgrade Modal - shows when trial has expired */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Fullscreen Preview Modal */}
      <ImageLightbox
        image={studioUI.lightboxImage}
        isOpen={studioUI.isFullscreen}
        onClose={handleLightboxClose}
        mediaNavigation={lightboxMediaNavigation}
        onInsertPrompt={(content) => {
          // Insert the prompt into the prompt section via the manager's ref
          promptManager.promptSectionRef.current?.setPrompt(content);
          promptManager.setHasPromptContent(content.trim().length > 0);
        }}
      />

      {/* Low Balance Warning Dialog - shows before generation when balance is low */}
      <LowBalanceWarningDialog
        isOpen={showLowBalanceWarning}
        onClose={handleLowBalanceClose}
        onConfirm={handleLowBalanceConfirm}
        currentBalance={formattedBalance}
        estimatedCost={formattedCost}
        remainingBalance={formatRemainingBalance(remainingAfter)}
        cannotAfford={!canAfford}
        modelName={modelDisplayName}
        isBatch={batchMode.batchSettings.enabled}
        batchCount={batchCount}
      />
    </div>
  );
}
