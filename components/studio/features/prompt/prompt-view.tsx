"use client"

/**
 * PromptView - Pure presentational component for prompt input
 * 
 * Renders the prompt section UI including:
 * - Main prompt input with character counter
 * - AI enhancement controls
 * - Suggestion chips
 * - Prompt history dropdown
 * - Negative prompt (collapsible)
 * 
 * This is a "leaf" component - it receives all data via props and has no internal logic.
 * Wrapped in React.memo for optimal performance.
 */

import {
    CollapsibleSection,
    PromptSection,
    PromptHeaderControls,
    type PromptSectionAPI,
} from "@/components/studio"
import { Separator } from "@/components/ui/separator"
import { Wand2 } from "lucide-react"
import * as React from "react"

export interface PromptViewProps {
    /** Ref to PromptSection API for reading values */
    apiRef: React.RefObject<PromptSectionAPI | null>
    /** Whether generation is in progress */
    isGenerating?: boolean
    /** Whether to show negative prompt (model-dependent) */
    showNegativePrompt?: boolean
    /** Prompt history for autocomplete */
    promptHistory?: string[]
    /** Handle history item selection */
    onSelectHistory?: (prompt: string) => void
    /** AI-generated suggestions */
    suggestions?: string[]
    /** Whether suggestions are loading */
    isLoadingSuggestions?: boolean
    /** Main prompt enhancement state */
    isEnhancingPrompt?: boolean
    onEnhancePrompt?: () => void
    onCancelEnhancePrompt?: () => void
    /** Negative prompt enhancement state */
    isEnhancingNegativePrompt?: boolean
    onEnhanceNegativePrompt?: () => void
    onCancelEnhanceNegativePrompt?: () => void
    /** Content change notification */
    onContentChange?: (hasContent: boolean) => void
    /** Whether to show prompt library features (requires auth) */
    showLibrary?: boolean
}

export const PromptView = React.memo(function PromptView({
    apiRef,
    isGenerating = false,
    showNegativePrompt = true,
    promptHistory = [],
    onSelectHistory,
    suggestions = [],
    isLoadingSuggestions = false,
    isEnhancingPrompt = false,
    onEnhancePrompt,
    onCancelEnhancePrompt,
    isEnhancingNegativePrompt = false,
    onEnhanceNegativePrompt,
    onCancelEnhanceNegativePrompt,
    onContentChange,
    showLibrary = false,
}: PromptViewProps) {
    return (
        <CollapsibleSection
            title="Prompt"
            icon={<Wand2 className="h-3.5 w-3.5" />}
            testId="prompt-section"
            rightContent={
                <PromptHeaderControls
                    maxLength={2000}
                    hasHistory={promptHistory.length > 0}
                    promptSectionRef={apiRef}
                />
            }
        >
            <PromptSection
                apiRef={apiRef}
                isGenerating={isGenerating}
                showNegativePrompt={showNegativePrompt}
                promptHistory={promptHistory}
                onSelectHistory={onSelectHistory}
                suggestions={suggestions}
                isLoadingSuggestions={isLoadingSuggestions}
                isEnhancingPrompt={isEnhancingPrompt}
                onEnhancePrompt={onEnhancePrompt}
                onCancelEnhancePrompt={onCancelEnhancePrompt}
                isEnhancingNegativePrompt={isEnhancingNegativePrompt}
                onEnhanceNegativePrompt={onEnhanceNegativePrompt}
                onCancelEnhanceNegativePrompt={onCancelEnhanceNegativePrompt}
                onContentChange={onContentChange}
                hideHeader
                showLibrary={showLibrary}
            />
            <Separator className="bg-border/50" />
        </CollapsibleSection>
    )
})
