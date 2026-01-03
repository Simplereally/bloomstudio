/**
 * Prompt Library Feature
 *
 * A modal for browsing, searching, and managing saved prompts.
 *
 * Architecture:
 * - PromptLibrary: Main Dialog wrapper and view router
 * - PromptListView: Search, filters, and prompt grid
 * - PromptCard: Individual prompt preview card
 * - PromptDetail: Full prompt view with actions
 * - SavePromptForm: Create new prompt form
 *
 * Hooks:
 * - usePromptLibrary: Main state management (hooks/use-prompt-library.ts)
 * - usePromptLibraryForm: Form state with refs (hooks/use-prompt-library-form.ts)
 */

// Main component
export { PromptLibrary } from "./prompt-library"

// Sub-components
export { PromptCard } from "./prompt-card"
export { PromptDetail } from "./prompt-detail"
export { PromptListView } from "./prompt-list-view"
export { SavePromptForm } from "./save-prompt-form"

// Button components
export { PromptLibraryButton } from "./prompt-library-button"
export type { PromptLibraryButtonProps } from "./prompt-library-button"

export { SavePromptButton } from "./save-prompt-button"
export type { SavePromptButtonProps } from "./save-prompt-button"

// Types
export type {
    CategoryOption,
    Prompt,
    PromptLibraryProps,
    PromptType,
} from "./types"
