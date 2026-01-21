"use client"

import { PromptLibrary } from "@/components/studio/features/prompt-library"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { isVideoContent } from "@/components/ui/media-player"
import type { Id } from "@/convex/_generated/dataModel"
import { useImageDetails } from "@/hooks/queries/use-image-history"
import { useImageLightbox } from "@/hooks/use-image-lightbox"
import type { LightboxImage } from "@/hooks/use-image-lightbox"
import { cn } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import * as React from "react"

import {
  InfoOverlayContent,
  StaticImageContent,
  VideoContent,
} from "./lightbox-components"
import {
  getScrollContainerClass,
  hasSeparateThumbnailUrl,
  mergeImageWithDetails,
  shouldShowSpinner,
} from "./lightbox-helpers"

export type { LightboxImage } from "@/hooks/use-image-lightbox"

// =============================================================================
// Helper sub-components to reduce main component complexity
// =============================================================================

interface LoadingSpinnerProps {
  readonly visible: boolean
}

function LoadingSpinner({ visible }: LoadingSpinnerProps) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <Loader2 className="w-10 h-10 animate-spin text-white/50" />
    </div>
  )
}

interface HoverZoneProps {
  readonly isZoomed: boolean
  readonly setIsHovering: (v: boolean) => void
  readonly onClick: () => void
}

function HoverZone({ isZoomed, setIsHovering, onClick }: HoverZoneProps) {
  if (isZoomed) return null
  return (
    <div
      className="absolute bottom-0 inset-x-0 h-[15vh] min-h-[150px] z-[5] cursor-default"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    />
  )
}

interface InfoOverlayProps {
  readonly isZoomed: boolean
  readonly isHovering: boolean
  readonly isLoadingDetails: boolean
  readonly image: LightboxImage
  readonly isSignedIn: boolean
  readonly copied: boolean
  readonly setIsHovering: (v: boolean) => void
  readonly onSave: () => void
  readonly onCopy: (e: React.MouseEvent) => Promise<void>
}

function InfoOverlay({
  isZoomed,
  isHovering,
  isLoadingDetails,
  image,
  isSignedIn,
  copied,
  setIsHovering,
  onSave,
  onCopy,
}: InfoOverlayProps) {
  const shouldShow = !isZoomed && isHovering
  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.125, ease: "easeOut" }}
          className="absolute bottom-0 inset-x-0 p-6 pt-8 bg-gradient-to-t from-black/70 via-black/60 to-transparent pointer-events-none z-20"
        >
          <InfoOverlayContent
            isLoadingDetails={isLoadingDetails}
            image={image}
            isSignedIn={isSignedIn}
            copied={copied}
            setIsHovering={setIsHovering}
            onSave={onSave}
            onCopy={onCopy}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface MediaContentProps {
  readonly isLoadingDetails: boolean
  readonly isVideo: boolean
  readonly image: LightboxImage
  readonly isZoomed: boolean
  readonly canZoom: boolean
  readonly naturalSize: { width: number; height: number }
  readonly hasSeparateThumbnail: boolean
  readonly thumbnailUrl: string | undefined
  readonly fullResUrl: string
  readonly isThumbnailLoaded: boolean
  readonly isFullResLoaded: boolean
  readonly setIsThumbnailLoaded: (v: boolean) => void
  readonly setIsFullResLoaded: (v: boolean) => void
  readonly setIsHovering: (v: boolean) => void
  readonly toggleZoom: (e: React.MouseEvent) => void
  readonly handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

function MediaContent({
  isLoadingDetails,
  isVideo,
  image,
  isZoomed,
  canZoom,
  naturalSize,
  hasSeparateThumbnail,
  thumbnailUrl,
  fullResUrl,
  isThumbnailLoaded,
  isFullResLoaded,
  setIsThumbnailLoaded,
  setIsFullResLoaded,
  setIsHovering,
  toggleZoom,
  handleImageLoad,
}: MediaContentProps) {
  if (isLoadingDetails) return null
  if (isVideo) {
    return <VideoContent image={image} setIsHovering={setIsHovering} />
  }
  return (
    <StaticImageContent
      image={image}
      isZoomed={isZoomed}
      canZoom={canZoom}
      naturalSize={naturalSize}
      hasSeparateThumbnail={hasSeparateThumbnail}
      thumbnailUrl={thumbnailUrl}
      fullResUrl={fullResUrl}
      isThumbnailLoaded={isThumbnailLoaded}
      isFullResLoaded={isFullResLoaded}
      setIsThumbnailLoaded={setIsThumbnailLoaded}
      setIsFullResLoaded={setIsFullResLoaded}
      setIsHovering={setIsHovering}
      toggleZoom={toggleZoom}
      handleImageLoad={handleImageLoad}
    />
  )
}

// =============================================================================
// Custom hook for lightbox data preparation
// =============================================================================

interface UseLightboxDataResult {
  displayImage: LightboxImage | null
  isVideo: boolean
  isLoadingDetails: boolean
  thumbnailUrl: string | undefined
  fullResUrl: string
  hasSeparateThumbnail: boolean
}

function useLightboxData(image: LightboxImage | null): UseLightboxDataResult {
  const imageId = image?._id as Id<"generatedImages"> | undefined
  const needsFullData = Boolean(image && !image.prompt && imageId)
  const fullImageData = useImageDetails(needsFullData ? imageId : null)

  const displayImage: LightboxImage | null = image
    ? mergeImageWithDetails(image, fullImageData)
    : null

  const isVideo = Boolean(displayImage && isVideoContent(displayImage.contentType, displayImage.url))
  const isLoadingDetails = needsFullData && fullImageData === undefined

  const thumbnailUrl = displayImage?.url
  const fullResUrl = displayImage?.originalUrl ?? displayImage?.url ?? ""
  const hasSeparateThumbnail = Boolean(displayImage && hasSeparateThumbnailUrl(displayImage))

  return {
    displayImage,
    isVideo,
    isLoadingDetails,
    thumbnailUrl,
    fullResUrl,
    hasSeparateThumbnail,
  }
}

// =============================================================================
// Main Component
// =============================================================================

interface ImageLightboxProps {
  readonly image: LightboxImage | null
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onInsertPrompt?: (content: string) => void
}

export function ImageLightbox({ image, isOpen, onClose, onInsertPrompt }: ImageLightboxProps) {
  const {
    displayImage,
    isVideo,
    isLoadingDetails,
    thumbnailUrl,
    fullResUrl,
    hasSeparateThumbnail,
  } = useLightboxData(image)

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
    hasDragged: hasDraggedRef,
    isHovering,
    setIsHovering
  } = useImageLightbox({ image: displayImage, isOpen })

  const { isSignedIn } = useAuth()

  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const [saveContent, setSaveContent] = React.useState<string | undefined>(undefined)
  const [isThumbnailLoaded, setIsThumbnailLoaded] = React.useState(false)
  const [isFullResLoaded, setIsFullResLoaded] = React.useState(false)

  React.useEffect(() => {
    setIsThumbnailLoaded(false)
    setIsFullResLoaded(false)
  }, [displayImage?.url, displayImage?.originalUrl])

  const scrollContainerClass = getScrollContainerClass(isZoomed, isDragging)
  const showSpinner = shouldShowSpinner(isLoadingDetails, isVideo, isThumbnailLoaded, isFullResLoaded)

  const handleSaveToLibrary = () => {
    if (!displayImage?.prompt) return
    setSaveContent(displayImage.prompt)
    setLibraryOpen(true)
  }

  const handleScrollContainerClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    if (e.target === e.currentTarget) onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleLibraryClose = () => {
    setLibraryOpen(false)
    setSaveContent(undefined)
  }

  const handleLibraryInsert = (content: string) => {
    onInsertPrompt?.(content)
    setLibraryOpen(false)
  }

  if (!displayImage) {
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
              <DialogDescription>Loading image preview</DialogDescription>
            </VisuallyHidden>
          </DialogContent>
        </Dialog>
        <PromptLibrary
          isOpen={libraryOpen}
          onClose={handleLibraryClose}
          promptType="positive"
          onInsert={handleLibraryInsert}
          initialSaveContent={saveContent}
          onInsertComplete={onClose}
        />
      </>
    )
  }

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
            <DialogDescription>Previewing image: {displayImage.prompt}</DialogDescription>
          </VisuallyHidden>

          <div
            className="w-full h-full bg-black/80 backdrop-blur-md cursor-default flex items-center justify-center animate-in fade-in duration-150"
            onClick={handleBackdropClick}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              ref={scrollContainerRef}
              className={cn("w-full h-full", scrollContainerClass)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onClick={handleScrollContainerClick}
            >
              <MediaContent
                isLoadingDetails={isLoadingDetails}
                isVideo={isVideo}
                image={displayImage}
                isZoomed={isZoomed}
                canZoom={canZoom}
                naturalSize={naturalSize}
                hasSeparateThumbnail={hasSeparateThumbnail}
                thumbnailUrl={thumbnailUrl}
                fullResUrl={fullResUrl}
                isThumbnailLoaded={isThumbnailLoaded}
                isFullResLoaded={isFullResLoaded}
                setIsThumbnailLoaded={setIsThumbnailLoaded}
                setIsFullResLoaded={setIsFullResLoaded}
                setIsHovering={setIsHovering}
                toggleZoom={toggleZoom}
                handleImageLoad={handleImageLoad}
              />
              <LoadingSpinner visible={showSpinner} />
            </div>

            <HoverZone isZoomed={isZoomed} setIsHovering={setIsHovering} onClick={onClose} />

            <InfoOverlay
              isZoomed={isZoomed}
              isHovering={isHovering}
              isLoadingDetails={isLoadingDetails}
              image={displayImage}
              isSignedIn={Boolean(isSignedIn)}
              copied={copied}
              setIsHovering={setIsHovering}
              onSave={handleSaveToLibrary}
              onCopy={handleCopyPrompt}
            />
          </div>
        </DialogContent>
      </Dialog>

      <PromptLibrary
        isOpen={libraryOpen}
        onClose={handleLibraryClose}
        promptType="positive"
        onInsert={handleLibraryInsert}
        initialSaveContent={saveContent}
        onInsertComplete={onClose}
      />
    </>
  )
}
