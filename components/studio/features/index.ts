/**
 * Studio Features - Public Exports
 * 
 * This module exports all feature components for the Studio page.
 * Each feature is a self-contained vertical slice with:
 * - Feature component (logic + composition)
 * - View component (pure presentation)
 * - Optional context for cross-feature state sharing
 * 
 * Architecture follows the "Hooked-Feature" (Headless UI) pattern:
 * 1. Logic (Custom Hooks) - Pure logic, state management, no JSX
 * 2. Presentation (View Components) - "Dumb" components, memoized
 * 3. Composition (Feature Components) - Glue between hooks and views
 */

// Prompt Feature
export {
    PromptFeature,
    PromptManagerContext,
    usePromptManagerContext,
    PromptView,
    type PromptViewProps,
} from "./prompt"

// Generation Controls Feature
export {
    ControlsFeature,
    GenerationSettingsContext,
    BatchModeContext,
    useGenerationSettingsContext,
    useBatchModeContext,
    ControlsView,
    type ControlsViewProps,
} from "./generation"

// Canvas Feature
export {
    CanvasFeature,
    CanvasView,
    type CanvasFeatureProps,
    type CanvasViewProps,
} from "./canvas"

// History/Gallery Feature
export {
    GalleryFeature,
    GalleryView,
    type GalleryFeatureProps,
    type GalleryViewProps,
} from "./history"

// Prompt Library Feature
export {
    PromptLibrary,
    PromptLibraryButton,
    SavePromptButton,
    type PromptLibraryButtonProps,
    type SavePromptButtonProps,
} from "./prompt-library"
