"use client"

/**
 * usePromptManager Hook
 * 
 * Manages prompt-related state and enhancement functionality.
 * Decoupled from other generation settings for optimal performance.
 * 
 * Features:
 * - Prompt history management (deduped, limited)
 * - AI-powered prompt enhancement (main + negative)
 * - Suggestions based on current prompt content
 * 
 * This hook follows the "Headless UI" pattern - pure logic with stable callbacks.
 */

import { useEnhancePrompt, useSuggestions } from "@/hooks/queries"
import type { PromptSectionAPI } from "@/components/studio"
import * as React from "react"

/** Maximum number of prompts to keep in history */
const MAX_HISTORY_SIZE = 10

/**
 * Return type for usePromptManager hook
 */
export interface UsePromptManagerReturn {
    // Prompt ref for accessing uncontrolled input values
    promptSectionRef: React.RefObject<PromptSectionAPI | null>

    // History state
    promptHistory: string[]
    addToPromptHistory: (prompt: string) => void

    // Suggestion state
    suggestions: string[]
    isLoadingSuggestions: boolean
    fetchSuggestions: (prompt: string) => void

    // Main prompt enhancement
    isEnhancingPrompt: boolean
    enhancePrompt: () => void
    cancelEnhancePrompt: () => void

    // Negative prompt enhancement
    isEnhancingNegativePrompt: boolean
    enhanceNegativePrompt: () => void
    cancelEnhanceNegativePrompt: () => void

    // Content change handler for generate button state
    handlePromptContentChange: (hasContent: boolean) => void

    // History selection handler
    handleSelectHistory: (prompt: string) => void

    // Current content state (for generate button)
    hasPromptContent: boolean
    setHasPromptContent: React.Dispatch<React.SetStateAction<boolean>>

    // Read prompt values (for submission)
    getPromptValues: () => { prompt: string; negativePrompt: string }
}

/**
 * Hook for managing prompt state, history, and enhancement.
 * 
 * @example
 * ```tsx
 * const {
 *     promptSectionRef,
 *     promptHistory,
 *     suggestions,
 *     isEnhancingPrompt,
 *     enhancePrompt,
 *     getPromptValues,
 * } = usePromptManager()
 * 
 * // At submission time
 * const { prompt, negativePrompt } = getPromptValues()
 * ```
 */
export function usePromptManager(): UsePromptManagerReturn {
    // Ref for accessing prompt values without causing re-renders
    const promptSectionRef = React.useRef<PromptSectionAPI>(null)

    // Local state for generate button - only updates when prompt content changes (debounced)
    const [hasPromptContent, setHasPromptContent] = React.useState(false)

    // Prompt history state
    const [promptHistory, setPromptHistory] = React.useState<string[]>([])

    // Dynamic AI-generated suggestions
    const { suggestions, isLoading: isLoadingSuggestions, fetchSuggestions } = useSuggestions()

    // Prompt enhancement for main prompt
    const {
        enhance: enhanceMainPrompt,
        cancel: cancelMainPromptEnhance,
        isEnhancing: isEnhancingPrompt,
    } = useEnhancePrompt({
        onSuccess: (enhancedText: string) => {
            promptSectionRef.current?.setPrompt(enhancedText)
            setHasPromptContent(enhancedText.trim().length > 0)
        },
    })

    // Prompt enhancement for negative prompt
    const {
        enhance: enhanceNegPrompt,
        cancel: cancelNegPromptEnhance,
        isEnhancing: isEnhancingNegativePrompt,
    } = useEnhancePrompt({
        onSuccess: (enhancedText: string) => {
            promptSectionRef.current?.setNegativePrompt(enhancedText)
        },
    })

    // Add prompt to history (deduped, max size limited) - stable callback
    const addToPromptHistory = React.useCallback((prompt: string) => {
        setPromptHistory((prev) => {
            if (prev.includes(prompt)) return prev
            return [prompt, ...prev.slice(0, MAX_HISTORY_SIZE - 1)]
        })
    }, [])

    // Handler to enhance main prompt - reads from ref
    const enhancePrompt = React.useCallback(() => {
        const currentPrompt = promptSectionRef.current?.getPrompt() ?? ""
        enhanceMainPrompt({ prompt: currentPrompt, type: "prompt" })
    }, [enhanceMainPrompt])

    // Handler to enhance negative prompt - reads from refs
    const enhanceNegativePrompt = React.useCallback(() => {
        const currentPrompt = promptSectionRef.current?.getPrompt() ?? ""
        const currentNegativePrompt = promptSectionRef.current?.getNegativePrompt() ?? ""
        enhanceNegPrompt({ prompt: currentPrompt, negativePrompt: currentNegativePrompt, type: "negative" })
    }, [enhanceNegPrompt])

    // Handle history selection (updates prompt via ref)
    const handleSelectHistory = React.useCallback((p: string) => {
        promptSectionRef.current?.setPrompt(p)
        setHasPromptContent(p.trim().length > 0)
    }, [])

    // Handle prompt content changes - update generate button state and fetch suggestions
    const handlePromptContentChange = React.useCallback((hasContent: boolean) => {
        setHasPromptContent(hasContent)
        // Fetch AI suggestions based on current prompt
        const currentPrompt = promptSectionRef.current?.getPrompt() ?? ""
        fetchSuggestions(currentPrompt)
    }, [fetchSuggestions])

    // Get current prompt values - for use at submission time
    const getPromptValues = React.useCallback(() => {
        return {
            prompt: promptSectionRef.current?.getPrompt()?.trim() ?? "",
            negativePrompt: promptSectionRef.current?.getNegativePrompt()?.trim() ?? "",
        }
    }, [])

    return {
        promptSectionRef,
        promptHistory,
        addToPromptHistory,
        suggestions,
        isLoadingSuggestions,
        fetchSuggestions,
        isEnhancingPrompt,
        enhancePrompt,
        cancelEnhancePrompt: cancelMainPromptEnhance,
        isEnhancingNegativePrompt,
        enhanceNegativePrompt,
        cancelEnhanceNegativePrompt: cancelNegPromptEnhance,
        handlePromptContentChange,
        handleSelectHistory,
        hasPromptContent,
        setHasPromptContent,
        getPromptValues,
    }
}
