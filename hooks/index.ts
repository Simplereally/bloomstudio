/**
 * Hooks Barrel Export
 *
 * Central export point for all custom hooks.
 */

// Query hooks (TanStack Query)
export * from "./queries"

// Dimension constraints hook
export { useDimensionConstraints } from "./use-dimension-constraints"

// Aspect ratio dimensions hook (standard resolutions)
export { useAspectRatioDimensions } from "./use-aspect-ratio-dimensions"
export type { UseAspectRatioDimensionsOptions, UseAspectRatioDimensionsReturn } from "./use-aspect-ratio-dimensions"

// Local state hooks
export { useGenerationControls } from "./use-generation-controls"
export type { GenerationControlsState, UseGenerationControlsProps } from "./use-generation-controls"

export { useImageDisplay } from "./use-image-display"
export type { UseImageDisplayReturn } from "./use-image-display"

export { useIsMobile } from "./use-mobile"

export { usePanelVisibility } from "./use-panel-visibility"

export { useImageGalleryState } from "./use-image-gallery-state"
export type { UseImageGalleryStateReturn } from "./use-image-gallery-state"

export { useImageSelection } from "./use-image-selection"
export type { UseImageSelectionReturn, SelectableImage } from "./use-image-selection"

export { useKeyboardShortcuts } from "./use-keyboard-shortcuts"
export type { KeyboardShortcutHandlers } from "./use-keyboard-shortcuts"

export { useAuthStatus } from "./use-auth-status"
export type { UseAuthStatusReturn } from "./use-auth-status"

export { RANDOM_SEED, generateRandomSeed, isRandomSeedMode, useRandomSeed } from "./use-random-seed"
export type { UseRandomSeedReturn } from "./use-random-seed"

// New refactored hooks (Hooked-Feature pattern)
export { usePromptManager } from "./use-prompt-manager"
export type { UsePromptManagerReturn } from "./use-prompt-manager"

export { useGenerationSettings } from "./use-generation-settings"
export type { UseGenerationSettingsReturn } from "./use-generation-settings"

export { useStudioUI } from "./use-studio-ui"
export type { UseStudioUIReturn } from "./use-studio-ui"

export { useBatchMode } from "./use-batch-mode"
export type { UseBatchModeReturn } from "./use-batch-mode"

export { usePromptLibrary } from "./use-prompt-library"
export type { UsePromptLibraryReturn, Prompt } from "./use-prompt-library"

export { usePromptLibraryForm } from "./use-prompt-library-form"
export type { UsePromptLibraryFormReturn } from "./use-prompt-library-form"

export { useSlideshow } from "./use-slideshow"
export type { UseSlideshowOptions, UseSlideshowReturn } from "./use-slideshow"

export { useVideoReferenceImages } from "./use-video-reference-images"
export type { VideoReferenceImages, FrameType } from "./use-video-reference-images"
