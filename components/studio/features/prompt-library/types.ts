/**
 * Shared types for the Prompt Library feature
 */

import type { Id } from "@/convex/_generated/dataModel"

export type PromptType = "positive" | "negative"

export interface Prompt {
    _id: Id<"prompts">
    title: string
    content: string
    type: PromptType
    tags: string[]
    category?: string
    createdAt: number
}

export interface PromptLibraryProps {
    /** Whether the modal is open */
    isOpen: boolean
    /** Callback to close the modal */
    onClose: () => void
    /** Type of prompt being browsed (affects insert target) */
    promptType: PromptType
    /** Callback when user wants to insert a prompt */
    onInsert: (content: string) => void
    /** Initial content to save (when opening from save action) */
    initialSaveContent?: string
    /** Optional callback after insert completes (for additional cleanup like closing parent modals) */
    onInsertComplete?: () => void
}

export interface CategoryOption {
    label: string
    value: string
}
