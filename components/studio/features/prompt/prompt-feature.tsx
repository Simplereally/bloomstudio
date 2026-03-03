"use client"

/**
 * PromptFeature - Feature component that composes prompt logic with UI
 * 
 * This component:
 * 1. Uses prompt manager from context if available (integrated mode)
 * 2. Or creates its own prompt manager (standalone mode)
 * 3. Passes the data into the PromptView presentational component
 * 
 * It acts as the "glue" between logic and presentation, forming an isolated
 * vertical feature unit that doesn't affect other parts of the Studio.
 */

import { usePromptManager, type UsePromptManagerReturn } from "@/hooks/use-prompt-manager"
import { PromptView } from "./prompt-view"
import * as React from "react"

export interface PromptFeatureProps {

    /** Whether to show negative prompt (model-dependent) */
    showNegativePrompt?: boolean
    /** Whether to show prompt library features (requires auth) */
    showLibrary?: boolean
}

/**
 * Context to share prompt manager state with other features
 */
export const PromptManagerContext = React.createContext<UsePromptManagerReturn | null>(null)

/**
 * Hook to access prompt manager from child components
 */
export function usePromptManagerContext() {
    const context = React.useContext(PromptManagerContext)
    if (!context) {
        throw new Error("usePromptManagerContext must be used within PromptFeature")
    }
    return context
}

/**
 * Internal view component that renders with a given prompt manager
 */
function PromptFeatureView({
    promptManager,

    showNegativePrompt,
    showLibrary,
}: {
    promptManager: UsePromptManagerReturn

    showNegativePrompt: boolean
    showLibrary: boolean
}) {
    return (
        <PromptView
            apiRef={promptManager.promptSectionRef}

            showNegativePrompt={showNegativePrompt}
            promptHistory={promptManager.promptHistory}
            onSelectHistory={promptManager.handleSelectHistory}
            suggestions={promptManager.suggestions}
            isLoadingSuggestions={promptManager.isLoadingSuggestions}
            isEnhancingPrompt={promptManager.isEnhancingPrompt}
            onEnhancePrompt={promptManager.enhancePrompt}
            onCancelEnhancePrompt={promptManager.cancelEnhancePrompt}
            isEnhancingNegativePrompt={promptManager.isEnhancingNegativePrompt}
            onEnhanceNegativePrompt={promptManager.enhanceNegativePrompt}
            onCancelEnhanceNegativePrompt={promptManager.cancelEnhanceNegativePrompt}
            onContentChange={promptManager.handlePromptContentChange}
            showLibrary={showLibrary}
        />
    )
}

/**
 * Standalone PromptFeature that creates its own prompt manager
 */
function PromptFeatureStandalone({

    showNegativePrompt,
    showLibrary,
}: {

    showNegativePrompt: boolean
    showLibrary: boolean
}) {
    const promptManager = usePromptManager()

    return (
        <PromptManagerContext.Provider value={promptManager}>
            <PromptFeatureView
                promptManager={promptManager}

                showNegativePrompt={showNegativePrompt}
                showLibrary={showLibrary}
            />
        </PromptManagerContext.Provider>
    )
}

/**
 * PromptFeature component - composes hook logic with view
 * 
 * When wrapped in a PromptManagerContext.Provider, uses the provided context.
 * Otherwise, creates its own prompt manager (standalone mode).
 * 
 * @example
 * ```tsx
 * // Standalone usage
 * <PromptFeature 
 *     showNegativePrompt={supportsNegativePrompt}
 * />
 * 
 * // Integrated usage (with shared state)
 * <PromptManagerContext.Provider value={promptManager}>
 *     <PromptFeature />
 * </PromptManagerContext.Provider>
 * ```
 */
export function PromptFeature({

    showNegativePrompt = true,
    showLibrary = false,
}: PromptFeatureProps) {
    const existingContext = React.useContext(PromptManagerContext)

    // If context is provided by parent, use it (integrated mode)
    if (existingContext) {
        return (
            <PromptFeatureView
                promptManager={existingContext}

                showNegativePrompt={showNegativePrompt}
                showLibrary={showLibrary}
            />
        )
    }

    // Otherwise, create own state (standalone mode)
    return (
        <PromptFeatureStandalone

            showNegativePrompt={showNegativePrompt}
            showLibrary={showLibrary}
        />
    )
}
