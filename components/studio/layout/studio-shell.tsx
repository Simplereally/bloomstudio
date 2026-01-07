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
import { Pause, Play, Sparkles, X } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

// Studio Components
import { ImageLightbox } from "@/components/images/image-lightbox"
import {
    ApiKeyOnboardingModal,
    StudioHeader,
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
import { useGenerationSettings } from "@/hooks/use-generation-settings"
import { useImageGalleryState } from "@/hooks/use-image-gallery-state"
import { usePromptManager } from "@/hooks/use-prompt-manager"
import { useStudioUI } from "@/hooks/use-studio-ui"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { getModelSupportsNegativePrompt } from "@/lib/config/models"
import { isTrialExpiredError, showAuthRequiredToast, showErrorToast } from "@/lib/errors"
import { isLocalhost } from "@/lib/utils"
import type { ImageGenerationParams, VideoGenerationParams } from "@/types/pollinations"
import type { ThumbnailData } from "@/components/studio/gallery/image-gallery"
import { useConvexAuth } from "convex/react"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

export interface StudioShellProps {
    defaultLayout?: Record<string, number>
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
export function StudioShell({ defaultLayout }: StudioShellProps) {
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

    // Check if running on localhost (for dev-only features)
    const [isLocalDev, setIsLocalDev] = React.useState(false)
    React.useEffect(() => {
        setIsLocalDev(isLocalhost())
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
    // Image Generation
    // ========================================
    const { generate, isGenerating } = useGenerateImage({
        onSuccess: (image) => {
            galleryState.addImage(image)
            generationSettings.refreshSeedIfNeeded()
        },
        onError: (error) => {
            if (error.code === "UNAUTHORIZED") {
                showAuthRequiredToast()
            } else if (isTrialExpiredError(error)) {
                // Show upgrade modal instead of toast for trial expiration
                setShowUpgradeModal(true)
            } else {
                showErrorToast(error)
            }
        },
    })

    // ========================================
    // Generation Handler
    // ========================================
    const handleGenerateClick = React.useCallback(() => {
        const { prompt, negativePrompt } = promptManager.getPromptValues()

        if (!prompt) return

        // Prevent generation if we're waiting for upgrade verification
        if (searchParams.get("upgraded") === "true" && subscriptionStatus !== "pro") {
            toast.info("Please wait while we confirm your subscription...", {
                id: "upgrade-pending-block"
            })
            return
        }

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

        const params: any = {
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
            // Video-specific parameters
            duration: generationSettings.videoSettings.duration,
            audio: generationSettings.videoSettings.audio,
            aspectRatio: generationSettings.aspectRatio, // Use current aspect ratio string
            lastFrameImage: generationSettings.videoReferenceImages.lastFrame,
        }

        generate(params)
    }, [
        promptManager,
        generationSettings,
        batchMode,
        generate,
        searchParams,
        subscriptionStatus
    ])

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
    // Sidebar Content
    // ========================================
    const sidebarContent = (
        <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/50 mr-1">
            <ScrollArea className="flex-1 min-h-0 overflow-hidden">
                <div className="p-2 space-y-1 w-full min-w-0 overflow-x-hidden">
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

            {/* Generate / Pause / Resume Batch Button */}
            <div className="p-2 border-t border-border/50 bg-card/80">
                {batchMode.isBatchActive ? (
                    <div className="flex gap-2">
                        {/* Pause/Resume toggle button */}
                        {batchMode.isBatchPaused ? (
                            <Button
                                onClick={batchMode.resumeBatchGeneration}
                                className="flex-1 h-11 text-base font-semibold"
                                size="lg"
                            >
                                <Play className="mr-2 h-4 w-4 fill-current" />
                                Resume ({batchMode.batchProgress.completedCount}/{batchMode.batchProgress.totalCount})
                            </Button>
                        ) : (
                            <Button
                                onClick={batchMode.pauseBatchGeneration}
                                variant="secondary"
                                className="flex-1 h-11 text-base font-semibold"
                                size="lg"
                            >
                                <Pause className="mr-2 h-4 w-4 fill-current" />
                                Pause ({batchMode.batchProgress.completedCount}/{batchMode.batchProgress.totalCount})
                            </Button>
                        )}
                        {/* Cancel button */}
                        <Button
                            onClick={batchMode.cancelBatchGeneration}
                            variant="destructive"
                            className="h-11 px-3"
                            size="lg"
                            title="Cancel batch generation"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={handleGenerateClick}
                        disabled={isGenerating || !promptManager.hasPromptContent}
                        className="w-full h-11 text-base font-semibold"
                        size="lg"
                    >
                        {isGenerating ? (
                            "Generating..."
                        ) : batchMode.batchSettings.enabled ? (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Batch ({batchMode.batchSettings.count})
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Image
                            </>
                        )}
                    </Button>
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
            isGenerating={isGenerating}
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
        />
    )

    // ========================================
    // Render
    // ========================================
    return (
        <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background overflow-hidden">
            {/* Panel Toggle Header */}
            <StudioHeader
                leftSidebarOpen={studioUI.showLeftSidebar}
                onToggleLeftSidebar={studioUI.toggleLeftSidebar}
                rightPanelOpen={studioUI.showGallery}
                onToggleRightPanel={studioUI.toggleGallery}
            />

            {/* Main Layout */}
            <main className="flex-1 overflow-hidden">
                <StudioLayout
                    sidebar={sidebarContent}
                    canvas={canvasContent}
                    gallery={galleryContent}
                    showSidebar={studioUI.showLeftSidebar}
                    showGallery={studioUI.showGallery}
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
        </div>
    )
}
