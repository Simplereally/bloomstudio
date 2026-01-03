"use client"

/**
 * PromptHeaderControls - Header controls for the Prompt section
 * Displays character count and history toggle button
 * 
 * IMPORTANT: This component manages its own character count state to avoid
 * re-rendering parent components on every keystroke. It subscribes directly
 * to DOM input events via MutationObserver-style polling.
 */

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { History } from "lucide-react"
import * as React from "react"
import { type PromptSectionAPI } from "./prompt-section"

export interface PromptHeaderControlsProps {
    /** Maximum character length */
    maxLength: number
    /** Whether prompt history exists */
    hasHistory: boolean
    /** Ref to the prompt section API */
    promptSectionRef: React.RefObject<PromptSectionAPI | null>
    /** Whether the history is currently open (for styling) */
    isHistoryOpen?: boolean
}

export const PromptHeaderControls = React.memo(function PromptHeaderControls({
    maxLength,
    hasHistory,
    promptSectionRef,
}: PromptHeaderControlsProps) {
    // Local character count state - updated via subscription, not parent re-renders
    const [characterCount, setCharacterCount] = React.useState(0)
    const isNearLimit = characterCount > maxLength * 0.9
    
    // Subscribe to prompt input changes using direct DOM event listener
    // This avoids parent re-renders entirely
    React.useEffect(() => {
        // Get the prompt input element from the section
        // We need to find it in the DOM since we don't have direct ref access
        const promptInput = document.querySelector('[data-testid="prompt-input"]') as HTMLTextAreaElement | null
        
        if (!promptInput) {
            // Retry on next frame if not yet mounted
            const timeoutId = setTimeout(() => {
                const input = document.querySelector('[data-testid="prompt-input"]') as HTMLTextAreaElement | null
                if (input) {
                    setCharacterCount(input.value.length)
                }
            }, 0)
            return () => clearTimeout(timeoutId)
        }
        
        // Initialize with current value
        setCharacterCount(promptInput.value.length)
        
        // Listen for input events directly on the textarea
        const handleInput = () => {
            setCharacterCount(promptInput.value.length)
        }
        
        promptInput.addEventListener('input', handleInput)
        
        // Also listen for programmatic value changes (e.g., history select, enhance)
        // Using a MutationObserver approach via polling
        let lastValue = promptInput.value
        const intervalId = setInterval(() => {
            if (promptInput.value !== lastValue) {
                lastValue = promptInput.value
                setCharacterCount(promptInput.value.length)
            }
        }, 100)
        
        return () => {
            promptInput.removeEventListener('input', handleInput)
            clearInterval(intervalId)
        }
    }, [])

    return (
        <div className="flex items-center gap-2">
            {hasHistory && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => promptSectionRef.current?.toggleHistory()}
                            data-testid="prompt-header-history-toggle"
                        >
                            <History className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Recent prompts</TooltipContent>
                </Tooltip>
            )}
            <span
                className={`text-xs tabular-nums ${isNearLimit ? "text-destructive" : "text-muted-foreground"}`}
                data-testid="prompt-header-character-count"
            >
                {characterCount}/{maxLength}
            </span>
        </div>
    )
})
