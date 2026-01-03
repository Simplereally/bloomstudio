"use client"

/**
 * usePromptLibrary Hook
 *
 * Manages the Prompt Library modal state and operations.
 * Follows the same patterns as useStudioUI - pure logic with stable callbacks.
 *
 * Features:
 * - Search with memoized filtering
 * - View state (list, detail, form)
 * - Type filter
 * - Clipboard operations
 * - CRUD operations via Convex
 */

import type { Prompt, PromptType } from "@/components/studio/features/prompt-library/types"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import * as React from "react"
import { toast } from "sonner"

// Re-export types for consumers
export type { Prompt, PromptType } from "@/components/studio/features/prompt-library/types"

type ViewState = "list" | "detail" | "save-form"

export interface UsePromptLibraryProps {
    /** Whether the modal is open */
    isOpen: boolean
    /** Callback to close the modal */
    onClose: () => void
    /** Type of prompt being browsed */
    promptType: PromptType
    /** Callback when user wants to insert a prompt */
    onInsert: (content: string) => void
    /** Initial content to save (when opening from save action) */
    initialSaveContent?: string
    /** Optional callback after insert completes (for additional cleanup like closing parent modals) */
    onInsertComplete?: () => void
}

export interface UsePromptLibraryReturn {
    // Search
    searchQuery: string
    setSearchQuery: (query: string) => void
    searchInputRef: React.RefObject<HTMLInputElement | null>

    // View state
    viewState: ViewState
    setViewState: (state: ViewState) => void
    selectedPrompt: Prompt | null
    selectPrompt: (prompt: Prompt | null) => void

    // Filter
    typeFilter: PromptType | "all"
    setTypeFilter: (filter: PromptType | "all") => void

    // Data
    prompts: Prompt[]
    isLoading: boolean

    // Actions
    handleCopy: (content: string) => void
    handleInsert: (content: string) => void
    handleRemove: (promptId: Id<"prompts">) => Promise<void>
    showSaveForm: () => void
    goBackToList: () => void
}

/**
 * Hook for managing the Prompt Library modal state and operations.
 */
export function usePromptLibrary({
    isOpen,
    onClose,
    onInsert,
    initialSaveContent,
    onInsertComplete,
}: UsePromptLibraryProps): UsePromptLibraryReturn {
    // ========================================
    // Search State
    // ========================================
    const [searchQuery, setSearchQuery] = React.useState("")
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    // ========================================
    // View State
    // ========================================
    const [viewState, setViewState] = React.useState<ViewState>(
        initialSaveContent ? "save-form" : "list"
    )
    const [selectedPrompt, setSelectedPrompt] = React.useState<Prompt | null>(null)

    // ========================================
    // Filter State
    // ========================================
    const [typeFilter, setTypeFilter] = React.useState<PromptType | "all">("all")

    // ========================================
    // Convex Queries & Mutations
    // ========================================
    const userLibrary = useQuery(
        api.promptLibrary.getUserLibrary,
        { type: typeFilter === "all" ? undefined : typeFilter, limit: 100 }
    )
    const removeFromLibrary = useMutation(api.promptLibrary.removeFromLibrary)

    // ========================================
    // Effects
    // ========================================
    // Auto-focus search on open
    React.useEffect(() => {
        if (isOpen && searchInputRef.current && viewState === "list") {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }, [isOpen, viewState])

    // Reset state on close
    React.useEffect(() => {
        if (!isOpen) {
            setSelectedPrompt(null)
            setViewState("list")
            setSearchQuery("")
        }
    }, [isOpen])

    // Show save form if initial content provided
    React.useEffect(() => {
        if (initialSaveContent && isOpen) {
            setViewState("save-form")
        }
    }, [initialSaveContent, isOpen])

    // ========================================
    // Memoized Filtered Prompts
    // ========================================
    const allPrompts = userLibrary ?? []

    const prompts = React.useMemo(() => {
        if (!searchQuery.trim()) return allPrompts as Prompt[]
        const query = searchQuery.toLowerCase()
        return (allPrompts as Prompt[]).filter(
            (p) =>
                p &&
                (p.title.toLowerCase().includes(query) ||
                    p.content.toLowerCase().includes(query) ||
                    p.tags.some((t) => t.toLowerCase().includes(query)))
        )
    }, [allPrompts, searchQuery])

    // ========================================
    // Stable Callbacks
    // ========================================
    const handleCopy = React.useCallback((content: string) => {
        navigator.clipboard.writeText(content)
        toast.success("Copied to clipboard!")
    }, [])

    const handleInsert = React.useCallback(
        (content: string) => {
            onInsert(content)
            onClose()
            toast.success("Prompt inserted!")
            // Call optional completion callback (e.g., to close parent lightbox)
            onInsertComplete?.()
        },
        [onInsert, onClose, onInsertComplete]
    )

    const handleRemove = React.useCallback(
        async (promptId: Id<"prompts">) => {
            try {
                await removeFromLibrary({ promptId })
                toast.success("Removed from library")
                setSelectedPrompt(null)
                setViewState("list")
            } catch {
                toast.error("Failed to remove prompt")
            }
        },
        [removeFromLibrary]
    )

    const selectPrompt = React.useCallback((prompt: Prompt | null) => {
        setSelectedPrompt(prompt)
        if (prompt) {
            setViewState("detail")
        }
    }, [])

    const showSaveForm = React.useCallback(() => {
        setViewState("save-form")
    }, [])

    const goBackToList = React.useCallback(() => {
        setSelectedPrompt(null)
        setViewState("list")
    }, [])

    return {
        // Search
        searchQuery,
        setSearchQuery,
        searchInputRef,

        // View state
        viewState,
        setViewState,
        selectedPrompt,
        selectPrompt,

        // Filter
        typeFilter,
        setTypeFilter,

        // Data
        prompts,
        isLoading: userLibrary === undefined,

        // Actions
        handleCopy,
        handleInsert,
        handleRemove,
        showSaveForm,
        goBackToList,
    }
}
