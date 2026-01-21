"use client"

import { Button } from "@/components/ui/button"
import { MediaPlayer } from "@/components/ui/media-player"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { LightboxImage } from "@/hooks/use-image-lightbox"
import { cn } from "@/lib/utils"
import { BookmarkPlus, Check, Copy, Loader2, LogIn, ZoomIn } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"
import type * as React from "react"
import {
  getDimension,
  getFullResOpacityClass,
  getImageCursorClass,
  getModelLabel,
  getSeedValue,
  getSizeDisplay,
  getThumbnailOpacityClass,
  hasModel,
  hasSize,
  shouldShowSeed,
  ACTION_BUTTON_CLASS,
  ACTION_BUTTON_UNAUTH_CLASS,
  IMAGE_CONSTRAINT_CLASS,
} from "./lightbox-helpers"

// =============================================================================
// Metadata Components
// =============================================================================

interface MetadataPillProps {
  readonly children: React.ReactNode
}

function MetadataPill({ children }: MetadataPillProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 text-[10px] md:text-xs font-medium backdrop-blur-md transition-colors shadow-sm">
      {children}
    </div>
  )
}

interface ModelPillProps {
  readonly label: string
}

function ModelPill({ label }: ModelPillProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white/90 backdrop-blur-md transition-colors shadow-sm">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
  )
}

interface ImageMetadataProps {
  readonly image: LightboxImage
}

export function ImageMetadata({ image }: ImageMetadataProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasModel(image) && <ModelPill label={getModelLabel(image)} />}
      {hasSize(image) && (
        <MetadataPill>
          <span className="text-white/40">Size</span>
          <span className="font-mono">{getSizeDisplay(image)}</span>
        </MetadataPill>
      )}
      {shouldShowSeed(image) && (
        <MetadataPill>
          <span className="text-white/40">Seed</span>
          <span className="font-mono">{getSeedValue(image)}</span>
        </MetadataPill>
      )}
    </div>
  )
}

// =============================================================================
// Action Buttons
// =============================================================================

interface SaveToLibraryButtonProps {
  readonly isSignedIn: boolean
  readonly disabled: boolean
  readonly onSave: () => void
}

export function SaveToLibraryButton({ isSignedIn, disabled, onSave }: SaveToLibraryButtonProps) {
  if (isSignedIn) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={ACTION_BUTTON_CLASS}
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            disabled={disabled}
          >
            <BookmarkPlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[100]">
          <p className="font-medium">Save to Library</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Link href="/sign-in" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className={ACTION_BUTTON_UNAUTH_CLASS}>
            <BookmarkPlus className="h-5 w-5" />
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-[100]">
        <div className="flex items-center gap-2">
          <LogIn className="h-3.5 w-3.5" />
          <p className="font-medium">Sign in to save prompts</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface CopyPromptButtonProps {
  readonly isSignedIn: boolean
  readonly disabled: boolean
  readonly copied: boolean
  readonly onCopy: (e: React.MouseEvent) => Promise<void>
}

export function CopyPromptButton({ isSignedIn, disabled, copied, onCopy }: CopyPromptButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    void onCopy(e)
  }

  if (isSignedIn) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={ACTION_BUTTON_CLASS}
            onClick={handleClick}
            disabled={disabled}
          >
            {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[100]">
          <p className="font-medium">{copied ? "Copied!" : "Copy prompt"}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Link href="/sign-in" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className={ACTION_BUTTON_UNAUTH_CLASS}>
            <Copy className="h-5 w-5" />
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-[100]">
        <div className="flex items-center gap-2">
          <LogIn className="h-3.5 w-3.5" />
          <p className="font-medium">Sign in to copy prompts</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface ActionButtonsProps {
  readonly isSignedIn: boolean
  readonly isLoadingDetails: boolean
  readonly prompt: string | undefined
  readonly copied: boolean
  readonly onSave: () => void
  readonly onCopy: (e: React.MouseEvent) => Promise<void>
}

export function ActionButtons({ isSignedIn, isLoadingDetails, prompt, copied, onSave, onCopy }: ActionButtonsProps) {
  const disabled = isLoadingDetails || !prompt
  return (
    <div className="flex items-center gap-2">
      <SaveToLibraryButton isSignedIn={isSignedIn} disabled={disabled} onSave={onSave} />
      <CopyPromptButton isSignedIn={isSignedIn} disabled={disabled} copied={copied} onCopy={onCopy} />
    </div>
  )
}

// =============================================================================
// Info Overlay
// =============================================================================

interface InfoOverlayContentProps {
  readonly isLoadingDetails: boolean
  readonly image: LightboxImage
  readonly isSignedIn: boolean
  readonly copied: boolean
  readonly setIsHovering: (v: boolean) => void
  readonly onSave: () => void
  readonly onCopy: (e: React.MouseEvent) => Promise<void>
}

export function InfoOverlayContent({
  isLoadingDetails,
  image,
  isSignedIn,
  copied,
  setIsHovering,
  onSave,
  onCopy,
}: InfoOverlayContentProps) {
  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="flex items-end justify-between gap-8 pointer-events-auto max-w-[1400px] mx-auto w-full px-4 md:px-6"
    >
      <div className="flex flex-col gap-3 max-w-3xl">
        {isLoadingDetails ? (
          <div className="flex items-center gap-2 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading details...</span>
          </div>
        ) : (
          <>
            <p className="text-white text-sm md:text-base font-medium leading-relaxed line-clamp-2 antialiased drop-shadow-sm">
              {image.prompt}
            </p>
            <ImageMetadata image={image} />
          </>
        )}
      </div>
      <ActionButtons
        isSignedIn={isSignedIn}
        isLoadingDetails={isLoadingDetails}
        prompt={image.prompt}
        copied={copied}
        onSave={onSave}
        onCopy={onCopy}
      />
    </div>
  )
}

// =============================================================================
// Media Content Components
// =============================================================================

interface VideoContentProps {
  readonly image: LightboxImage
  readonly setIsHovering: (v: boolean) => void
}

export function VideoContent({ image, setIsHovering }: VideoContentProps) {
  const alt = image.prompt ?? "Generated video"
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div
        className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm group/video z-10"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <MediaPlayer
          url={image.url}
          alt={alt}
          contentType={image.contentType}
          controls={true}
          autoPlay={true}
          loop={true}
          muted={false}
          className="w-auto h-auto max-w-[100vw] max-h-[100vh] object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  )
}

interface StaticImageContentProps {
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

export function StaticImageContent({
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
}: StaticImageContentProps) {
  const alt = image.prompt ?? "Generated image"
  const width = getDimension(image.width, image.params?.width, 1000)
  const height = getDimension(image.height, image.params?.height, 1000)

  const cursorClass = getImageCursorClass(canZoom, isZoomed)
  const thumbnailOpacityClass = getThumbnailOpacityClass(isThumbnailLoaded, isFullResLoaded)
  const fullResOpacityClass = getFullResOpacityClass(hasSeparateThumbnail, isFullResLoaded)
  const constraintClass = isZoomed ? "" : IMAGE_CONSTRAINT_CLASS

  const containerStyle = isZoomed ? {
    width: naturalSize.width,
    height: naturalSize.height,
    flexShrink: 0 as const,
    margin: 'auto' as const
  } : undefined

  const thumbnailUnoptimized = thumbnailUrl ? thumbnailUrl.startsWith('http') : false
  const fullResUnoptimized = fullResUrl.startsWith('http')
  const showZoomIndicator = canZoom && !isZoomed && (isThumbnailLoaded || isFullResLoaded)

  return (
    <div
      className="relative"
      style={containerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "relative shadow-[0_0_50px_rgba(0,0,0,0.5)] group/image z-10",
          !isZoomed && "rounded-sm",
          cursorClass
        )}
        onClick={toggleZoom}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {hasSeparateThumbnail && thumbnailUrl && (
          <NextImage
            src={thumbnailUrl}
            alt={alt}
            onLoad={() => setIsThumbnailLoaded(true)}
            draggable={false}
            width={width}
            height={height}
            priority
            unoptimized={thumbnailUnoptimized}
            className={cn(
              "w-auto h-auto object-contain select-none transition-all duration-500",
              constraintClass,
              thumbnailOpacityClass
            )}
          />
        )}

        <NextImage
          src={fullResUrl}
          alt={alt}
          onLoad={(e) => {
            handleImageLoad(e as unknown as React.SyntheticEvent<HTMLImageElement>)
            setIsFullResLoaded(true)
          }}
          draggable={false}
          decoding="sync"
          width={width}
          height={height}
          priority={true}
          unoptimized={fullResUnoptimized}
          className={cn(
            "w-auto h-auto object-contain select-none transition-opacity duration-500",
            constraintClass,
            fullResOpacityClass
          )}
        />
      </div>

      {showZoomIndicator && (
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md rounded-full p-2 border border-white/10 text-white/70">
            <ZoomIn className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  )
}
