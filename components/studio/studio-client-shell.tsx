"use client"

import * as React from "react"
import { ClerkUserButton } from "@/components/clerk-user-button"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sparkles } from "lucide-react"

// Studio Components
import {
    StudioLayout,
    StudioHeader,
    PromptComposer,
    ModelSelector,
    AspectRatioSelector,
    DimensionControls,
    SeedControl,
    OptionsPanel,
    ImageCanvas,
    ImageToolbar,
    ImageMetadata,
    ImageGallery,
    type GenerationOptions,
} from "@/components/studio"
import {
    Dialog,
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

// Types and utilities
import type { ImageGenerationParams, GeneratedImage, AspectRatio, ImageModel } from "@/types/pollinations"
import { IMAGE_MODELS, ASPECT_RATIOS } from "@/lib/image-models"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { useStudioClientShell } from "@/hooks/use-studio-client-shell"

interface StudioClientShellProps {
    defaultLayout?: Record<string, number>
}

export function StudioClientShell({ defaultLayout }: StudioClientShellProps) {
    const {
        prompt,
        setPrompt,
        negativePrompt,
        setNegativePrompt,
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
    } = useStudioClientShell()

    // Sidebar content
    const sidebarContent = (
        <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/50">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {/* Prompt Section */}
                    <PromptComposer
                        prompt={prompt}
                        onPromptChange={setPrompt}
                        negativePrompt={negativePrompt}
                        onNegativePromptChange={setNegativePrompt}
                        isGenerating={isGenerating}
                        promptHistory={promptHistory}
                        onSelectHistory={setPrompt}
                        suggestions={["cinematic lighting", "8k ultra HD", "detailed"]}
                        onAddSuggestion={(s: string) => setPrompt((p: string) => `${p} ${s}`.trim())}
                    />

                    <Separator className="bg-border/50" />

                    {/* Model Selection */}
                    <ModelSelector
                        selectedModel={model}
                        onModelChange={setModel}
                        models={IMAGE_MODELS}
                        disabled={isGenerating}
                    />

                    {/* Aspect Ratio */}
                    <AspectRatioSelector
                        selectedRatio={aspectRatio}
                        onRatioChange={handleAspectRatioChange}
                        ratios={ASPECT_RATIOS}
                        disabled={isGenerating}
                    />

                    {/* Dimensions */}
                    <DimensionControls
                        width={width}
                        height={height}
                        onWidthChange={handleWidthChange}
                        onHeightChange={handleHeightChange}
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
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
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

    // Canvas content with toolbar and metadata
    const canvasContent = (
        <div className="h-full flex flex-col bg-background/50">
            <div className="flex-1 relative group p-4">
                <ImageCanvas
                    image={currentImage}
                    isGenerating={isGenerating}
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
                images={images}
                activeImageId={currentImage?.id}
                onSelectImage={setCurrentImage}
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

            {/* Fullscreen Preview Modal */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogPortal>
                    <DialogOverlay className="bg-black/90 backdrop-blur-sm z-[100]" />
                    <DialogContent
                        className="!fixed !inset-0 !z-[101] !flex !items-center !justify-center !border-none !bg-transparent !p-0 !shadow-none !w-screen !h-screen !max-w-none !translate-x-0 !translate-y-0 !outline-none"
                        showCloseButton={true}
                    >
                        <VisuallyHidden>
                            <DialogTitle>Fullscreen Preview</DialogTitle>
                            <DialogDescription>
                                Previewing generated image in full size: {currentImage?.prompt}
                            </DialogDescription>
                        </VisuallyHidden>

                        {currentImage && (
                            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={() => setIsFullscreen(false)}>
                                <img
                                    src={currentImage.url}
                                    alt={currentImage.prompt}
                                    className="max-w-full max-h-full object-contain drop-shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                {/* Info overlay on hover/mobile */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center gap-4 text-white">
                                    <p className="text-sm font-medium truncate max-w-md">
                                        {currentImage.prompt}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                            {currentImage.params.width}x{currentImage.params.height}
                                        </span>
                                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                            {currentImage.params.model}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </DialogPortal>
            </Dialog>
        </div>
    )
}
