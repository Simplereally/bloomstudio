"use client"

import { ClerkUserButton } from "@/components/clerk-user-button"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sparkles } from "lucide-react"

// Studio Components
import {
    ApiKeyOnboardingModal,
    AspectRatioSelector,
    DimensionControls,
    ImageCanvas,
    PersistentImageGallery as ImageGallery,
    ImageMetadata,
    ImageToolbar,
    ModelSelector,
    OptionsPanel,
    PromptSection,
    type PromptSectionAPI,
    ReferenceImagePicker,
    SeedControl,
    StudioHeader,
    StudioLayout,
} from "@/components/studio"
import { ImageLightbox } from "@/components/ui/image-lightbox"

// Types and utilities
import { GeneratedImage, useEnhancePrompt, useImageModels } from "@/hooks/queries"
import { useStudioClientShell } from "@/hooks/use-studio-client-shell"
import { getModelSupportsNegativePrompt } from "@/lib/config/models"
import { useTheme } from "next-themes"
import * as React from "react"

interface StudioClientShellProps {
    defaultLayout?: Record<string, number>
}

export function StudioClientShell({ defaultLayout }: StudioClientShellProps) {
    const {
        model,
        setModel,
        aspectRatio,
        width,
        height,
        seed,
        setSeed,
        seedLocked,
        setSeedLocked,
        options,
        setOptions,
        isGenerating,
        showLeftSidebar,
        setShowLeftSidebar,
        showGallery,
        setShowGallery,
        selectionMode,
        setSelectionMode,
        selectedIds,
        setSelectedIds,
        images,
        currentImage,
        setCurrentImage,
        promptHistory,
        addToPromptHistory,
        handleAspectRatioChange,
        handleWidthChange,
        handleHeightChange,
        handleGenerate,
        handleRemoveImage,
        handleDeleteSelected,
        handleDownload,
        handleCopyUrl,
        handleRegenerate,
        handleOpenInNewTab,
        isFullscreen,
        setIsFullscreen,
        handleModelChange,
        aspectRatios,
        referenceImage,
        setReferenceImage,
    } = useStudioClientShell()

    const { models, isLoading: isLoadingModels } = useImageModels()
    const { theme, setTheme } = useTheme()

    // Ref for accessing prompt values without causing re-renders
    const promptSectionRef = React.useRef<PromptSectionAPI>(null)
    
    // Local state for generate button - only updates when prompt content changes
    const [hasPromptContent, setHasPromptContent] = React.useState(false)

    // Prompt enhancement for main prompt
    const {
        enhance: enhanceMainPrompt,
        cancel: cancelMainPromptEnhance,
        isEnhancing: isEnhancingMainPrompt,
    } = useEnhancePrompt({
        onSuccess: (enhancedText: string) => {
            promptSectionRef.current?.setPrompt(enhancedText)
            setHasPromptContent(enhancedText.trim().length > 0)
        },
    })

    // Prompt enhancement for negative prompt
    const {
        enhance: enhanceNegPrompt,
        cancel: cancelNegPromptEnhance,
        isEnhancing: isEnhancingNegPrompt,
    } = useEnhancePrompt({
        onSuccess: (enhancedText: string) => {
            promptSectionRef.current?.setNegativePrompt(enhancedText)
        },
    })

    // Handlers that read from ref (no state dependency on prompt values)
    const handleEnhancePrompt = React.useCallback(() => {
        const currentPrompt = promptSectionRef.current?.getPrompt() ?? ""
        enhanceMainPrompt({ prompt: currentPrompt, type: "prompt" })
    }, [enhanceMainPrompt])

    const handleEnhanceNegativePrompt = React.useCallback(() => {
        const currentPrompt = promptSectionRef.current?.getPrompt() ?? ""
        const currentNegativePrompt = promptSectionRef.current?.getNegativePrompt() ?? ""
        enhanceNegPrompt({ prompt: currentPrompt, negativePrompt: currentNegativePrompt, type: "negative" })
    }, [enhanceNegPrompt])

    // Handle history selection (updates prompt via ref)
    const handleSelectHistory = React.useCallback((p: string) => {
        promptSectionRef.current?.setPrompt(p)
        setHasPromptContent(p.trim().length > 0)
    }, [])

    // Handle generate - reads prompt values from ref at submission time
    const handleGenerateClick = React.useCallback(() => {
        const currentPrompt = promptSectionRef.current?.getPrompt() ?? ""
        const currentNegativePrompt = promptSectionRef.current?.getNegativePrompt() ?? ""
        
        if (!currentPrompt.trim()) return
        
        // Add to history
        addToPromptHistory(currentPrompt.trim())
        
        // Call the generation handler with current prompt values
        handleGenerate(currentPrompt.trim(), currentNegativePrompt.trim())
    }, [handleGenerate, addToPromptHistory])

    // Keyboard shortcut for Cmd/Ctrl + Enter to generate
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

    // Stable suggestions array
    const suggestions = React.useMemo(() => ["cinematic lighting", "8k ultra HD", "detailed"], [])

    // Sidebar content
    const sidebarContent = (
        <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/50">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {/* Prompt Section - uses uncontrolled inputs internally */}
                    <PromptSection
                        apiRef={promptSectionRef}
                        isGenerating={isGenerating}
                        showNegativePrompt={getModelSupportsNegativePrompt(model)}
                        promptHistory={promptHistory}
                        onSelectHistory={handleSelectHistory}
                        suggestions={suggestions}
                        isEnhancingPrompt={isEnhancingMainPrompt}
                        onEnhancePrompt={handleEnhancePrompt}
                        onCancelEnhancePrompt={cancelMainPromptEnhance}
                        isEnhancingNegativePrompt={isEnhancingNegPrompt}
                        onEnhanceNegativePrompt={handleEnhanceNegativePrompt}
                        onCancelEnhanceNegativePrompt={cancelNegPromptEnhance}
                        onContentChange={setHasPromptContent}
                    />

                    <Separator className="bg-border/50" />

                    {/* Model Selection */}
                    <ModelSelector
                        selectedModel={model}
                        onModelChange={handleModelChange}
                        models={models}
                        disabled={isGenerating || isLoadingModels}
                    />

                    {/* Aspect Ratio */}
                    <AspectRatioSelector
                        selectedRatio={aspectRatio}
                        onRatioChange={handleAspectRatioChange}
                        ratios={aspectRatios}
                        disabled={isGenerating}
                    />

                    {/* Dimensions */}
                    <DimensionControls
                        width={width}
                        height={height}
                        onWidthChange={handleWidthChange}
                        onHeightChange={handleHeightChange}
                        modelId={model}
                        disabled={isGenerating}
                    />

                    <Separator className="bg-border/50" />

                    {/* Reference Image */}
                    <ReferenceImagePicker
                        selectedImage={referenceImage}
                        onSelect={setReferenceImage}
                        disabled={isGenerating}
                    />

                    <Separator className="bg-border/50" />

                    {/* Seed */}
                    <SeedControl
                        seed={seed}
                        onSeedChange={setSeed}
                        isLocked={seedLocked}
                        onLockChange={setSeedLocked}
                        disabled={isGenerating}
                    />

                    {/* Options */}
                    <OptionsPanel
                        options={options}
                        onOptionsChange={setOptions}
                        disabled={isGenerating}
                    />
                </div>
            </ScrollArea>

            {/* Generate Button */}
            <div className="p-4 border-t border-border/50 bg-card/80">
                <Button
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !hasPromptContent}
                    className="w-full h-11 text-base font-semibold"
                    size="lg"
                >
                    {isGenerating ? (
                        "Generating..."
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Image
                        </>
                    )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Press ⌘ + Enter to generate
                </p>
            </div>
        </div>
    )

    const handleSelectGalleryImage = React.useCallback((image: GeneratedImage) => {
        setCurrentImage(image)
        setIsFullscreen(true)
    }, [setCurrentImage, setIsFullscreen])

    // Canvas content with toolbar and metadata
    const canvasContent = (
        <div className="h-full flex flex-col bg-background/50 overflow-hidden">
            <div className="flex-1 min-h-0 relative group p-4 overflow-hidden">
                <ImageCanvas
                    image={currentImage}
                    isGenerating={isGenerating}
                    onImageClick={() => setIsFullscreen(true)}
                    className="h-full"
                />
                <ImageToolbar
                    image={currentImage}
                    onDownload={() => currentImage && handleDownload(currentImage)}
                    onCopyUrl={() => currentImage && handleCopyUrl(currentImage)}
                    onRegenerate={handleRegenerate}
                    onOpenInNewTab={handleOpenInNewTab}
                    onFullscreen={() => setIsFullscreen(true)}
                />
            </div>
            {currentImage && !isGenerating && (
                <ImageMetadata
                    image={currentImage}
                    variant="compact"
                />
            )}
        </div>
    )

    // Gallery content
    const galleryContent = (
        <div className="h-full bg-card/50 backdrop-blur-sm border-l border-border/50">
            <ImageGallery
                activeImageId={currentImage?.id}
                onSelectImage={handleSelectGalleryImage}
                onRemoveImage={handleRemoveImage}
                onDownloadImage={handleDownload}
                onCopyImageUrl={handleCopyUrl}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onToggleSelectionMode={() => setSelectionMode((prev: boolean) => !prev)}
                onDeleteSelected={handleDeleteSelected}
                thumbnailSize="md"
            />
        </div>
    )

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <StudioHeader
                userButton={<ClerkUserButton afterSignOutUrl="/" />}
                leftSidebarOpen={showLeftSidebar}
                onToggleLeftSidebar={() => setShowLeftSidebar((prev: boolean) => !prev)}
                rightPanelOpen={showGallery}
                onToggleRightPanel={() => setShowGallery((prev: boolean) => !prev)}
                theme={theme === "light" ? "light" : "dark"}
                onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            />

            {/* Main Layout */}
            <main className="flex-1 overflow-hidden">
                <StudioLayout
                    sidebar={sidebarContent}
                    canvas={canvasContent}
                    gallery={galleryContent}
                    showSidebar={showLeftSidebar}
                    showGallery={showGallery}
                    defaultSidebarSize="22%"
                    defaultGallerySize="18%"
                    defaultLayout={defaultLayout}
                />
            </main>

            {/* API Key Onboarding Modal - shows when user doesn't have a key */}
            <ApiKeyOnboardingModal />

            {/* Fullscreen Preview Modal */}
            <ImageLightbox 
                image={currentImage} 
                isOpen={isFullscreen} 
                onClose={() => setIsFullscreen(false)} 
            />
        </div>
    )
}
