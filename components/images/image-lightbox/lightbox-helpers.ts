import { getModelDisplayName } from "@/lib/config/models"
import type { LightboxImage } from "@/hooks/use-image-lightbox"

// =============================================================================
// Pure helper functions for ImageLightbox component
// =============================================================================

export interface FullImageData {
  url?: string
  prompt?: string
  model?: string
  width?: number
  height?: number
  seed?: number
  contentType?: string
}

/** Merges thumbnail image data with full resolution data when available */
export function mergeImageWithDetails(
  image: LightboxImage,
  fullData: FullImageData | null | undefined
): LightboxImage {
  const url = fullData?.url ?? image.url
  const prompt = fullData?.prompt ?? image.prompt ?? ""
  const model = fullData?.model ?? image.model
  const width = fullData?.width ?? image.width
  const height = fullData?.height ?? image.height
  const seed = fullData?.seed ?? image.seed
  const contentType = fullData?.contentType ?? image.contentType

  const params = image.params ?? (fullData ? {
    model: fullData.model,
    width: fullData.width,
    height: fullData.height,
    seed: fullData.seed,
  } : undefined)

  return { ...image, url, prompt, model, width, height, seed, contentType, params }
}

/** Returns the effective dimension value with fallback to params then default */
export function getDimension(
  direct: number | undefined,
  fromParams: number | undefined,
  fallback: number
): number {
  return direct ?? fromParams ?? fallback
}

/** Determines if image has separate thumbnail and full-res URLs */
export function hasSeparateThumbnailUrl(image: LightboxImage): boolean {
  return Boolean(image.originalUrl && image.originalUrl !== image.url)
}

/** Computes the model display label with fallbacks */
export function getModelLabel(image: LightboxImage): string {
  const modelValue = image.params?.model ?? image.model ?? ""
  const displayName = getModelDisplayName(modelValue)
  if (displayName) return displayName
  return modelValue || "Unknown"
}

/** Computes whether seed should be displayed (non-negative) */
export function shouldShowSeed(image: LightboxImage): boolean {
  const seed = image.params?.seed ?? image.seed
  return seed !== undefined && seed !== -1
}

/** Gets seed value for display */
export function getSeedValue(image: LightboxImage): number | undefined {
  return image.params?.seed ?? image.seed
}

/** Computes whether size should be displayed */
export function hasSize(image: LightboxImage): boolean {
  return Boolean(image.params?.width ?? image.width)
}

/** Gets size display string */
export function getSizeDisplay(image: LightboxImage): string {
  const w = image.params?.width ?? image.width
  const h = image.params?.height ?? image.height
  return `${w}×${h}`
}

/** Computes whether model should be displayed */
export function hasModel(image: LightboxImage): boolean {
  return Boolean(image.params?.model ?? image.model)
}

/** Computes loading spinner visibility */
export function shouldShowSpinner(
  isLoadingDetails: boolean,
  isVideo: boolean,
  isThumbnailLoaded: boolean,
  isFullResLoaded: boolean
): boolean {
  if (isLoadingDetails) return true
  if (isVideo) return false
  return !isThumbnailLoaded && !isFullResLoaded
}

/** Computes cursor class for image container */
export function getImageCursorClass(canZoom: boolean, isZoomed: boolean): string {
  if (!canZoom) return "cursor-default"
  if (!isZoomed) return "cursor-zoom-in"
  return ""
}

/** Computes thumbnail opacity/blur class */
export function getThumbnailOpacityClass(isThumbnailLoaded: boolean, isFullResLoaded: boolean): string {
  if (!isThumbnailLoaded) return "opacity-0"
  if (isFullResLoaded) return "opacity-0 pointer-events-none absolute inset-0"
  return "blur-[2px]"
}

/** Computes full-res opacity class */
export function getFullResOpacityClass(hasSeparateThumbnail: boolean, isFullResLoaded: boolean): string {
  if (hasSeparateThumbnail) {
    return isFullResLoaded ? "opacity-100" : "opacity-0"
  }
  return isFullResLoaded ? "opacity-100" : "opacity-0"
}

/** Computes scroll container class */
export function getScrollContainerClass(isZoomed: boolean, isDragging: boolean): string {
  if (!isZoomed) return "flex items-center justify-center overflow-hidden"
  const cursorClass = isDragging ? "cursor-grabbing" : "cursor-grab"
  return `overflow-auto flex ${cursorClass}`
}

/** Image constraint class constant */
export const IMAGE_CONSTRAINT_CLASS = "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] md:max-w-[calc(100vw-6rem)] md:max-h-[calc(100vh-8rem)]"

/** Action button styling constants */
export const ACTION_BUTTON_CLASS = "h-10 w-10 mb-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg"
export const ACTION_BUTTON_UNAUTH_CLASS = "h-10 w-10 mb-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg"
