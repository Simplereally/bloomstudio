/**
 * Studio Components - Public Exports
 * 
 * Modular image generation studio components for building
 * professional-grade AI image creation interfaces.
 */

// Layout Components
export { StudioLayout, type StudioLayoutProps } from "./layout/studio-layout"
export { StudioHeader, type StudioHeaderProps } from "./layout/studio-header"

// Control Components
export { PromptComposer, type PromptComposerProps } from "./controls/prompt-composer"
export { ModelSelector, type ModelSelectorProps } from "./controls/model-selector"
export { AspectRatioSelector, type AspectRatioSelectorProps } from "./controls/aspect-ratio-selector"
export { DimensionControls, type DimensionControlsProps } from "./controls/dimension-controls"
export { SeedControl, type SeedControlProps } from "./controls/seed-control"
export { ReferenceImagePicker } from "./controls/reference-image-picker"
export { OptionsPanel, type OptionsPanelProps, type GenerationOptions } from "./controls/options-panel"

// Canvas Components
export { ImageCanvas, type ImageCanvasProps } from "./canvas/image-canvas"
export { ImageToolbar, type ImageToolbarProps } from "./canvas/image-toolbar"
export { ImageMetadata, type ImageMetadataProps } from "./canvas/image-metadata"

// Gallery Components
export { ImageGallery, type ImageGalleryProps } from "./gallery/image-gallery"
export { PersistentImageGallery } from "./gallery/persistent-image-gallery"
export { GalleryThumbnail, type GalleryThumbnailProps } from "./gallery/gallery-thumbnail"

// Onboarding Components
export { ApiKeyOnboardingModal } from "./api-key-onboarding-modal"
