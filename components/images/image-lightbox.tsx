"use client"

import { PromptLibrary } from "@/components/studio/features/prompt-library"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { isVideoContent, MediaPlayer } from "@/components/ui/media-player"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Id } from "@/convex/_generated/dataModel"
import { useImageDetails } from "@/hooks/queries/use-image-history"
import { useImageLightbox, type LightboxImage } from "@/hooks/use-image-lightbox"
import { getModelDisplayName } from "@/lib/config/models"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { AnimatePresence, motion } from "framer-motion"
import { BookmarkPlus, Check, Copy, Loader2, ZoomIn } from "lucide-react"
import NextImage from "next/image"
import * as React from "react"

export type { LightboxImage }

interface ImageLightboxProps {
  image: LightboxImage | null
  isOpen: boolean
  onClose: () => void
  /** Optional callback when a prompt is inserted from the library (used to update prompt input) */
  onInsertPrompt?: (content: string) => void
}

export function ImageLightbox({ image, isOpen, onClose, onInsertPrompt }: ImageLightboxProps) {
  // Fetch full image details if we only have thumbnail data (no prompt)
  // This happens when opening from gallery which now returns lightweight data
  const imageId = image?._id as Id<"generatedImages"> | undefined
  const needsFullData = image && !image.prompt && imageId
  const fullImageData = useImageDetails(needsFullData ? imageId : null)

  // Merge thumbnail data with full data when available
  const displayImage: LightboxImage | null = image ? {
    ...image,
    // Use full data if available, otherwise fall back to what we have
    prompt: fullImageData?.prompt ?? image.prompt ?? "",
    model: fullImageData?.model ?? image.model,
    width: fullImageData?.width ?? image.width,
    height: fullImageData?.height ?? image.height,
    seed: fullImageData?.seed ?? image.seed,
    contentType: fullImageData?.contentType ?? image.contentType,
    params: image.params ?? (fullImageData ? {
      model: fullImageData.model,
      width: fullImageData.width,
      height: fullImageData.height,
      seed: fullImageData.seed,
    } : undefined),
  } : null

  const isLoadingDetails = needsFullData && fullImageData === undefined

  const {
    copied,
    isZoomed,
    naturalSize,
    isDragging,
    scrollContainerRef,
    canZoom,
    handleCopyPrompt,
    handleImageLoad,
    toggleZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    hasDragged
  } = useImageLightbox({ image: displayImage, isOpen })

  // Prompt library state for saving prompts
  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const [saveContent, setSaveContent] = React.useState<string | undefined>(undefined)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="!fixed !inset-0 !flex !items-center !justify-center !border-none !bg-transparent !p-0 !shadow-none !w-screen !h-screen !max-w-none !translate-x-0 !translate-y-0 !outline-none !duration-75"
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <DialogTitle>Fullscreen Preview</DialogTitle>
            <DialogDescription>
              Previewing image: {displayImage?.prompt}
            </DialogDescription>
          </VisuallyHidden>

          {displayImage && (
            <div
              className="w-full h-full bg-black/80 backdrop-blur-md cursor-default flex items-center justify-center animate-in fade-in duration-150"
              onClick={onClose}
            >
              {/* Scrollable container for zoomed view, centered flex for non-zoomed */}
              <div
                ref={scrollContainerRef}
                className={cn(
                  "w-full h-full",
                  isZoomed
                    ? cn(
                      "overflow-auto flex items-center justify-center",
                      isDragging ? "cursor-grabbing" : "cursor-grab"
                    )
                    : "flex items-center justify-center overflow-hidden"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  if (hasDragged.current) {
                    hasDragged.current = false
                    return
                  }
                  if (e.target === e.currentTarget) {
                    onClose()
                  }
                }}
              >
                <React.Fragment>
                  {/* Video: Full player with controls, no zoom */}
                  {isVideoContent(displayImage.contentType, displayImage.url) ? (
                    <div className="relative flex items-center justify-center p-4 w-full h-full min-h-full">
                      <div
                        className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] md:max-w-[calc(100vw-6rem)] md:max-h-[calc(100vh-8rem)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MediaPlayer
                          url={displayImage.url}
                          alt={displayImage.prompt || "Generated video"}
                          contentType={displayImage.contentType}
                          controls={true}
                          autoPlay={true}
                          loop={true}
                          muted={false}
                          className="w-auto h-auto max-w-full max-h-full object-contain select-none"
                          draggable={false}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Image: specific settings preserved from old version */
                    <div
                      className="relative"
                      style={isZoomed ? {
                        width: naturalSize.width,
                        height: naturalSize.height,
                        flexShrink: 0,
                        margin: 'auto'
                      } : undefined}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className={cn(
                          "relative shadow-[0_0_50px_rgba(0,0,0,0.5)] group/image",
                          !isZoomed && "rounded-sm",
                          !canZoom ? "cursor-default" : !isZoomed && "cursor-zoom-in"
                        )}
                        onClick={toggleZoom}
                      >
                        <NextImage
                          src={displayImage.url}
                          alt={displayImage.prompt || "Generated image"}
                          onLoad={(e) => handleImageLoad(e as unknown as React.SyntheticEvent<HTMLImageElement>)}
                          draggable={false}
                          width={displayImage.width || displayImage.params?.width || 1000}
                          height={displayImage.height || displayImage.params?.height || 1000}
                          priority
                          unoptimized={displayImage.url.startsWith('http')} // Don't re-optimize if it's already a full URL (likely from storage)
                          className={cn(
                            "w-auto h-auto object-contain select-none",
                            isZoomed
                              ? ""
                              : "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] md:max-w-[calc(100vw-6rem)] md:max-h-[calc(100vh-8rem)]"
                          )}
                        />
                      </div>

                      {/* Zoom indicator - only show if zoomable and not zoomed */}
                      {canZoom && !isZoomed && (
                        <div
                          className="absolute top-4 right-4 z-10 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none"
                        >
                          <div className="bg-black/40 backdrop-blur-md rounded-full p-2 border border-white/10 text-white/70">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              </div>

              {/* Info overlay - outside the scrolling content */}
              <AnimatePresence>
                {!isZoomed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.125, ease: "easeOut" }}
                    className="absolute bottom-0 inset-x-0 p-6 pt-8 bg-gradient-to-t from-black/70 via-black/60 to-transparent pointer-events-none z-20"
                  >
                    <div className="flex items-end justify-between gap-8 pointer-events-auto max-w-[1400px] mx-auto w-full px-4 md:px-6">
                      <div className="flex flex-col gap-3 max-w-3xl">
                        {isLoadingDetails ? (
                          <div className="flex items-center gap-2 text-white/60">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading details...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-white text-sm md:text-base font-medium leading-relaxed line-clamp-2 antialiased drop-shadow-sm">
                              {displayImage.prompt}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              {(displayImage.params?.model || displayImage.model) && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 backdrop-blur-md transition-colors shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{getModelDisplayName(displayImage.params?.model || displayImage.model || "") || displayImage.params?.model || displayImage.model || "Unknown"}</span>
                                </div>
                              )}
                              {(displayImage.params?.width || displayImage.width) && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium backdrop-blur-md transition-colors shadow-sm">
                                  <span className="text-white/40">Size</span>
                                  <span className="font-mono">
                                    {displayImage.params?.width || displayImage.width}×{displayImage.params?.height || displayImage.height}
                                  </span>
                                </div>
                              )}
                              {(displayImage.params?.seed || displayImage.seed) && (displayImage.params?.seed !== -1 && displayImage.seed !== -1) && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium backdrop-blur-md transition-colors shadow-sm">
                                  <span className="text-white/40">Seed</span>
                                  <span className="font-mono">{displayImage.params?.seed || displayImage.seed}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Save to Library Button */}
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 mb-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (displayImage.prompt) {
                                  setSaveContent(displayImage.prompt)
                                  setLibraryOpen(true)
                                }
                              }}
                              disabled={isLoadingDetails || !displayImage.prompt}
                            >
                              <BookmarkPlus className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-[10]">
                            <p className="font-medium">Save to Library</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Copy Prompt Button */}
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 mb-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg"
                              onClick={handleCopyPrompt}
                              disabled={isLoadingDetails || !displayImage.prompt}
                            >
                              {copied ? (
                                <Check className="h-5 w-5 text-green-400" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="z-[10]">
                            <p className="font-medium">{copied ? "Copied!" : "Copy prompt"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* Prompt Library Modal - rendered as independent sibling so lightbox persists */}
      <PromptLibrary
        isOpen={libraryOpen}
        onClose={() => {
          setLibraryOpen(false)
          setSaveContent(undefined)
        }}
        promptType="positive"
        onInsert={(content) => {
          // Call the external handler to insert the prompt into the textarea
          onInsertPrompt?.(content)
          setLibraryOpen(false)
        }}
        initialSaveContent={saveContent}
        onInsertComplete={onClose}
      />
    </>
  )
}
