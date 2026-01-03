"use client"

/**
 * usePromptLibraryForm Hook
 *
 * Manages the save prompt form state using refs to prevent re-render cascades.
 * The key insight is that form field values don't need to cause re-renders
 * until submission time.
 *
 * This follows the same pattern as usePromptInput - using refs for values
 * that change frequently (like text input) but don't need to trigger UI updates.
 */

import type { PromptType } from "@/components/studio/features/prompt-library/types"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import * as React from "react"
import { toast } from "sonner"

export interface UsePromptLibraryFormProps {
    /** Initial content for the prompt */
    initialContent?: string
    /** Default prompt type */
    defaultPromptType: PromptType
    /** Callback when save is successful */
    onSaved: () => void
}

export interface UsePromptLibraryFormReturn {
    // Refs for inputs (avoids controlled input re-renders)
    titleRef: React.RefObject<HTMLInputElement | null>
    contentRef: React.RefObject<HTMLTextAreaElement | null>
    tagsRef: React.RefObject<HTMLInputElement | null>

    // Type is stateful because it changes the UI (badge color)
    type: PromptType
    setType: (type: PromptType) => void

    // Category state (needed for react-select)
    category: string | null
    setCategory: (category: string | null) => void

    // Categories from server for the dropdown
    categories: string[] | undefined

    // Form handlers
    handleSave: () => Promise<void>
    isSaving: boolean

    // Reset form
    reset: () => void
}

/**
 * Hook for managing the save prompt form with optimal performance.
 *
 * Uses refs for text inputs to avoid re-renders on every keystroke.
 * Only `type` and `category` are stateful because they affect visible UI elements.
 */
export function usePromptLibraryForm({
    initialContent = "",
    defaultPromptType,
    onSaved,
}: UsePromptLibraryFormProps): UsePromptLibraryFormReturn {
    // ========================================
    // Refs for frequently-changing values
    // ========================================
    const titleRef = React.useRef<HTMLInputElement>(null)
    const contentRef = React.useRef<HTMLTextAreaElement>(null)
    const tagsRef = React.useRef<HTMLInputElement>(null)

    // ========================================
    // Stateful values that affect UI
    // ========================================
    const [type, setType] = React.useState<PromptType>(defaultPromptType)
    const [category, setCategory] = React.useState<string | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // ========================================
    // Convex
    // ========================================
    const savePrompt = useMutation(api.promptLibrary.savePrompt)
    const categories = useQuery(api.promptLibrary.getCategories)

    // ========================================
    // Initialize content from props
    // ========================================
    React.useEffect(() => {
        if (contentRef.current && initialContent) {
            contentRef.current.value = initialContent
        }
    }, [initialContent])

    // ========================================
    // Form Handlers
    // ========================================
    const handleSave = React.useCallback(async () => {
        const title = titleRef.current?.value?.trim() ?? ""
        const content = contentRef.current?.value?.trim() ?? ""
        const tagsInput = tagsRef.current?.value ?? ""

        if (!title || !content) {
            toast.error("Title and content are required")
            return
        }

        setIsSaving(true)
        try {
            const tags = tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)

            const result = await savePrompt({
                title,
                content,
                type,
                tags,
                category: category ?? undefined,
            })

            if (result.alreadyExists) {
                toast.info("This prompt already exists in your library")
            } else {
                toast.success("Prompt saved to library!")
            }
            onSaved()
        } catch (error) {
            toast.error("Failed to save prompt")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }, [type, category, savePrompt, onSaved])

    const reset = React.useCallback(() => {
        if (titleRef.current) titleRef.current.value = ""
        if (contentRef.current) contentRef.current.value = ""
        if (tagsRef.current) tagsRef.current.value = ""
        setType(defaultPromptType)
        setCategory(null)
    }, [defaultPromptType])

    return {
        titleRef,
        contentRef,
        tagsRef,
        type,
        setType,
        category,
        setCategory,
        categories,
        handleSave,
        isSaving,
        reset,
    }
}
