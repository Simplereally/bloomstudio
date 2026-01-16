"use client"

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

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BatchActionButton } from "@/components/studio/batch/batch-action-button"

// Studio Components
import { ImageLightbox } from "@/components/images/image-lightbox"
import {
    ApiKeyOnboardingModal,
    BatchConfigButton,
    StudioLayout,
    UpgradeModal,
} from "@/components/studio"

// Feature Components
import { CanvasFeature } from "@/components/studio/features/canvas"
import {
    BatchModeContext,
    ControlsFeature,
    GenerationSettingsContext,
} from "@/components/studio/features/generation"
import { GalleryFeature } from "@/components/studio/features/history"
import {
    PromptFeature,
    PromptManagerContext,
} from "@/components/studio/features/prompt"

// Hooks
import { useGenerateImage } from "@/hooks/queries"
import { useBatchMode } from "@/hooks/use-batch-mode"
import { useEstimatedCost, formatRemainingBalance, LOW_BALANCE_AFTER_GENERATION_THRESHOLD } from "@/hooks/use-estimated-cost"
import { useGenerationSettings } from "@/hooks/use-generation-settings"
import { useImageGalleryState } from "@/hooks/use-image-gallery-state"
import { usePollenBalance } from "@/hooks/use-pollen-balance"
import { usePromptManager } from "@/hooks/use-prompt-manager"
import { useStudioUI } from "@/hooks/use-studio-ui"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { getModel, getModelSupportsNegativePrompt } from "@/lib/config/models"
import { isTrialExpiredError, showAuthRequiredToast, showErrorToast } from "@/lib/errors"
import type { ImageGenerationParams, VideoGenerationParams, VideoModel } from "@/types/pollinations"
import type { ThumbnailData } from "@/components/studio/gallery/image-gallery"
import { useConvexAuth } from "convex/react"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { invalidateUserHistoryCache } from "@/app/_server/actions/invalidation"
import { LowBalanceWarningDialog } from "@/components/pollen-balance/low-balance-warning-dialog"

// Type for the paginated result from server cache
type PaginatedGalleryResult = {
    page: Array<{
        _id: string
        _creationTime: number
        url: string
        visibility?: "public" | "unlisted"
        model?: string
        contentType?: string
    }>
    isDone: boolean
    continueCursor: string
}

export interface StudioShellProps {
    defaultLayout?: Record<string, number>
    /** Server-cached initial gallery page (reduces Convex bandwidth on initial load) */
    initialGalleryPage?: PaginatedGalleryResult
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
export function StudioShell({ defaultLayout, initialGalleryPage }: StudioShellProps) {
    // ========================================
    // Initialize Feature Hooks
    // ========================================
    const promptManager = usePromptManager()
    const generationSettings = useGenerationSettings()
    const studioUI = useStudioUI()
    const galleryState = useImageGalleryState()

    // Authentication state for features requiring auth
    const { isAuthenticated: isSignedIn } = useConvexAuth()

    // URL params for handling post-upgrade redirect
    const searchParams = useSearchParams()

    // Upgrade modal state (shown when trial expires)
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false)

    // Prevent any scroll at the root level for fixed viewport pages like Studio
    React.useEffect(() => {
        document.body.setAttribute("data-fixed-viewport", "true")
        return () => {
            document.body.removeAttribute("data-fixed-viewport")
        }
    }, [])

    // Subscription status for post-upgrade verification
    const { status: subscriptionStatus } = useSubscriptionStatus()

    // Handle successful upgrade redirect
    React.useEffect(() => {
        const isUpgraded = searchParams.get("upgraded") === "true"

        // If we have the upgraded param but subscription isn't active yet, show loading state
        if (isUpgraded) {
            if (subscriptionStatus === "pro") {
                toast.dismiss("upgrade-loading")
                toast.success("Welcome to Pro!", {
                    id: "upgrade-success", // Prevent duplicate toasts
                    description: "Your account has been upgraded. Start creating!",
                })
                // Clean up URL without reload
                window.history.replaceState({}, "", "/studio")
            } else {
                // Still processing webhook or loading
                toast.loading("Finalizing your upgrade...", {
                    id: "upgrade-loading",
                    description: "Syncing your subscription status with Stripe."
                })
            }
        }
    }, [searchParams, subscriptionStatus])

    // Batch mode (depends on generation settings and gallery)
    const batchMode = useBatchMode({
        generateSeed: generationSettings.generateSeed,
        addImage: galleryState.addImage,
        onTrialExpired: () => setShowUpgradeModal(true),
    })

    // ========================================
    // Pollen Balance & Cost Estimation
    // ========================================
    const { balance, formattedBalance } = usePollenBalance()

    // Get batch count for cost estimation
    const batchCount = batchMode.batchSettings.enabled ? batchMode.batchSettings.count : 1

    // Estimate cost based on current model and settings
    const {
        estimatedCost,
        canAfford,
        willDepleteBalance,
        remainingAfter,
        formattedCost,
    } = useEstimatedCost({
        modelId: generationSettings.model,
        balance,
        imageCount: batchCount,
        durationSeconds: generationSettings.videoSettings.duration,
    })

    // Low balance warning dialog state
    const [showLowBalanceWarning, setShowLowBalanceWarning] = React.useState(false)
    // Store pending generation params to execute after user confirms
    const pendingGenerationRef = React.useRef<(() => void) | null>(null)

    // Get model display name for dialog
    const currentModel = getModel(generationSettings.model)
    const modelDisplayName = currentModel?.displayName ?? generationSettings.model

    // ========================================
    // Image Generation
    // ========================================
    const { generate, isGenerating } = useGenerateImage({
        onSuccess: async (image) => {
            galleryState.addImage(image)
            generationSettings.refreshSeedIfNeeded()

            if (isSignedIn) {
                // Invalidate history cache so new image appears on history page
                await invalidateUserHistoryCache().catch(console.error)
            }
        },
        onError: (error) => {
            if (error.code === "UNAUTHORIZED") {
                showAuthRequiredToast()
            } else if (isTrialExpiredError(error)) {
                // Show upgrade modal instead of trial expired error
                setShowUpgradeModal(true)
            } else {
                showErrorToast(error)
            }
        },
    })

    // ========================================
    // Generation Handler
    // ========================================

    // Core generation logic (called directly or after warning confirmation)
    const executeGeneration = React.useCallback(() => {
        const { prompt, negativePrompt } = promptManager.getPromptValues()

        if (!prompt) return

        // Add to history
        promptManager.addToPromptHistory(prompt)

        // Batch mode
        if (batchMode.batchSettings.enabled) {
            batchMode.startBatchGeneration(
                {
                    prompt,
                    negativePrompt: negativePrompt || undefined,
                    model: generationSettings.model,
                    width: generationSettings.width,
                    height: generationSettings.height,
                    seed: generationSettings.seed === -1 ? undefined : generationSettings.seed,
                    enhance: generationSettings.options.enhance,
                    private: generationSettings.options.private,
                    safe: generationSettings.options.safe,
                    image: generationSettings.referenceImage,
                    // Video-specific parameters
                    duration: generationSettings.videoSettings.duration,
                    audio: generationSettings.videoSettings.audio,
                    aspectRatio: generationSettings.aspectRatio,
                    lastFrameImage: generationSettings.videoReferenceImages.lastFrame,
                },
                batchMode.batchSettings.count
            )
            return
        }

        // Single image generation
        const effectiveSeed = generationSettings.seed === -1
            ? generationSettings.generateSeed()
            : generationSettings.seed

        function isVideoModel(model: string): model is VideoModel {
            return model === "veo" || model === "seedance" || model === "seedance-pro"
        }

        const commonParams = {
            prompt,
            negativePrompt: negativePrompt || undefined,
            model: generationSettings.model,
            width: generationSettings.width,
            height: generationSettings.height,
            seed: effectiveSeed,
            enhance: generationSettings.options.enhance,
            private: generationSettings.options.private,
            safe: generationSettings.options.safe,
            image: generationSettings.referenceImage,
        }

        if (isVideoModel(generationSettings.model)) {
            const videoAspectRatio = generationSettings.aspectRatio === "16:9" || generationSettings.aspectRatio === "9:16"
                ? generationSettings.aspectRatio
                : undefined

            const params: VideoGenerationParams = {
                ...commonParams,
                model: generationSettings.model,
                duration: generationSettings.videoSettings.duration,
                audio: generationSettings.videoSettings.audio,
                aspectRatio: videoAspectRatio,
                lastFrameImage: generationSettings.videoReferenceImages.lastFrame,
            }
            generate(params)
            return
        }

        const params: ImageGenerationParams = commonParams
        generate(params)
    }, [promptManager, generationSettings, batchMode, generate])

    // Main click handler - checks balance before proceeding
    const handleGenerateClick = React.useCallback(() => {
        const { prompt } = promptManager.getPromptValues()

        if (!prompt) return

        // Prevent generation if we're waiting for upgrade verification
        if (searchParams.get("upgraded") === "true" && subscriptionStatus !== "pro") {
            toast.info("Please wait while we confirm your subscription...", {
                id: "upgrade-pending-block"
            })
            return
        }

        // Check if we should show low balance warning
        // Show warning if: can't afford OR will deplete balance below threshold
        if (!canAfford || willDepleteBalance) {
            // Store the generation function to call after confirmation
            pendingGenerationRef.current = executeGeneration
            setShowLowBalanceWarning(true)
            return
        }

        // Balance is fine, proceed with generation
        executeGeneration()
    }, [
        promptManager,
        searchParams,
        subscriptionStatus,
        canAfford,
        willDepleteBalance,
        executeGeneration
    ])

    // Handle warning dialog confirmation
    const handleLowBalanceConfirm = React.useCallback(() => {
        setShowLowBalanceWarning(false)
        // Execute the pending generation
        if (pendingGenerationRef.current) {
            pendingGenerationRef.current()
            pendingGenerationRef.current = null
        }
    }, [])

    // Handle warning dialog close/cancel
    const handleLowBalanceClose = React.useCallback(() => {
        setShowLowBalanceWarning(false)
        pendingGenerationRef.current = null
    }, [])

    // ========================================
    // Keyboard Shortcut for Generation
    // ========================================
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isGenerating) {
                e.preventDefault()
                handleGenerateClick()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isGenerating, handleGenerateClick])

    // ========================================
    // Gallery Image Selection Handler
    // ========================================
    const handleSelectGalleryImage = React.useCallback((image: ThumbnailData) => {
        studioUI.openLightbox(image)
    }, [studioUI])

    // ========================================
    // Regenerate Handler
    // ========================================
    const handleRegenerate = React.useCallback(() => {
        if (galleryState.currentImage) {
            const image = galleryState.currentImage
            promptManager.promptSectionRef.current?.setPrompt(image.prompt)
            promptManager.setHasPromptContent(true)
            // Trigger generation with same prompt
            generate({
                prompt: image.prompt,
                negativePrompt: image.params.negativePrompt,
                model: generationSettings.model,
                width: generationSettings.width,
                height: generationSettings.height,
                seed: generationSettings.generateSeed(),
                enhance: generationSettings.options.enhance,
                private: generationSettings.options.private,
                safe: generationSettings.options.safe,
            })
        }
    }, [galleryState, promptManager, generationSettings, generate])

    // ========================================
    // Sidebar Scroll State (for fade overlays)
    // ========================================
    const scrollViewportRef = React.useRef<HTMLDivElement>(null)
    const [showTopFade, setShowTopFade] = React.useState(false)
    const [showBottomFade, setShowBottomFade] = React.useState(false)

    const updateScrollFades = React.useCallback((el: HTMLDivElement | null) => {
        if (!el) return
        const { scrollTop, scrollHeight, clientHeight } = el
        const hasScrollableContent = scrollHeight > clientHeight
        setShowTopFade(scrollTop > 8)
        setShowBottomFade(hasScrollableContent && scrollTop + clientHeight < scrollHeight - 8)
    }, [])

    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        updateScrollFades(e.currentTarget)
    }, [updateScrollFades])

    // Check initial scroll state on mount
    React.useEffect(() => {
        // Small delay to let content render
        const timer = setTimeout(() => {
            updateScrollFades(scrollViewportRef.current)
        }, 100)
        return () => clearTimeout(timer)
    }, [updateScrollFades])

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
                        background: 'linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)',
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                    }}
                />

                <ScrollArea className="h-full" onScroll={handleScroll} viewportRef={scrollViewportRef}>
                    <div className="p-0 space-y-0.5 w-full min-w-0 overflow-x-hidden">
                        {/* Prompt Feature */}
                        <PromptManagerContext.Provider value={promptManager}>
                            <PromptFeature
                                isGenerating={isGenerating}
                                showNegativePrompt={getModelSupportsNegativePrompt(generationSettings.model)}
                                showLibrary={!!isSignedIn}
                            />
                        </PromptManagerContext.Provider>

                        {/* Generation Controls Feature */}
                        <GenerationSettingsContext.Provider value={generationSettings}>
                            <BatchModeContext.Provider value={batchMode}>
                                <ControlsFeature isGenerating={isGenerating} />
                            </BatchModeContext.Provider>
                        </GenerationSettingsContext.Provider>
                    </div>
                </ScrollArea>

                {/* Bottom fade overlay */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none transition-opacity duration-200"
                    style={{
                        opacity: showBottomFade ? 1 : 0,
                        background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)',
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
                    }}
                />
            </div>

            {/* Generate / Pause / Resume Batch Button */}
            <div className="p-1.5 border-t bg-background/60">
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
                    <div className="flex gap-1.5 w-full">
                        <Button
                            onClick={handleGenerateClick}
                            disabled={isGenerating || !promptManager.hasPromptContent}
                            className="flex-1 h-11 text-base font-semibold"
                            size="lg"
                        >
                            {isGenerating ? (
                                "Generating..."
                            ) : batchMode.batchSettings.enabled ? (
                                <>
                                    Generate Batch ({batchMode.batchSettings.count})
                                </>
                            ) : (
                                <>
                                    Generate Image
                                </>
                            )}
                        </Button>
                        <BatchConfigButton
                            settings={batchMode.batchSettings}
                            onSettingsChange={batchMode.setBatchSettings}
                            disabled={isGenerating || batchMode.isBatchActive}
                        />
                    </div>
                )}
            </div>
        </div>
    )

    // ========================================
    // Canvas Content
    // ========================================
    const canvasContent = (
        <CanvasFeature
            currentImage={galleryState.currentImage}
            isGenerating={isGenerating || batchMode.isBatchActive}
            progress={batchMode.isBatchActive ? (batchMode.batchProgress.totalCount > 0 ? (batchMode.batchProgress.completedCount / batchMode.batchProgress.totalCount) * 100 : 0) : undefined}
            onOpenLightbox={studioUI.openLightbox}
            onRegenerate={handleRegenerate}
        />
    )

    // ========================================
    // Gallery Content
    // ========================================
    const galleryContent = (
        <GalleryFeature
            activeImageId={galleryState.currentImage?.id}
            onSelectImage={handleSelectGalleryImage}
            thumbnailSize="md"
            initialPage={initialGalleryPage}
        />
    )

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
                onClose={studioUI.closeLightbox}
                onInsertPrompt={(content) => {
                    // Insert the prompt into the prompt section via the manager's ref
                    promptManager.promptSectionRef.current?.setPrompt(content)
                    promptManager.setHasPromptContent(content.trim().length > 0)
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
    )
}
