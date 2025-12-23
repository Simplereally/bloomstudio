/**
 * Hooks Barrel Export
 *
 * Central export point for all custom hooks.
 */

// Query hooks (TanStack Query)
export * from "./queries"

// Local state hooks
export { useGenerationControls } from "./use-generation-controls"
export type { UseGenerationControlsProps, GenerationControlsState } from "./use-generation-controls"

export { useImageDisplay } from "./use-image-display"
export type { UseImageDisplayReturn } from "./use-image-display"

export { useIsMobile } from "./use-mobile"

export { usePanelVisibility } from "./use-panel-visibility"

export { useStudioClientShell } from "./use-studio-client-shell"
export type { UseStudioClientShellReturn } from "./use-studio-client-shell"

export { useAuthStatus } from "./use-auth-status"
export type { UseAuthStatusReturn } from "./use-auth-status"
