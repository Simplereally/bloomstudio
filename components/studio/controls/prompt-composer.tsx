"use client"

/**
 * PromptComposer - Enhanced prompt input with negative prompt support
 * Follows SRP: Only manages prompt text input and composition
 */

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { EnhanceButton } from "@/components/ui/enhance-button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    ChevronDown,
    History,
    Lightbulb,
    Wand2,
    X,
} from "lucide-react"
import * as React from "react"

export interface PromptComposerProps {
    /** Current prompt value */
    prompt: string
    /** Callback when prompt changes */
    onPromptChange: (value: string) => void
    /** Current negative prompt value */
    negativePrompt?: string
    /** Callback when negative prompt changes */
    onNegativePromptChange?: (value: string) => void
    /** Whether generation is in progress */
    isGenerating?: boolean
    /** Maximum character limit for prompt */
    maxLength?: number
    /** Recent prompts for history */
    promptHistory?: string[]
    /** Callback when a history item is selected */
    onSelectHistory?: (prompt: string) => void
    /** Enhancement suggestions */
    suggestions?: string[]
    /** Callback when a suggestion is clicked */
    onAddSuggestion?: (suggestion: string) => void
    /** Additional class names */
    className?: string
    /** Whether the main prompt is being enhanced */
    isEnhancingPrompt?: boolean
    /** Callback to trigger prompt enhancement */
    onEnhancePrompt?: () => void
    /** Callback to cancel prompt enhancement */
    onCancelEnhancePrompt?: () => void
    /** Whether the negative prompt is being enhanced */
    isEnhancingNegativePrompt?: boolean
    /** Callback to trigger negative prompt enhancement */
    onEnhanceNegativePrompt?: () => void
    /** Callback to cancel negative prompt enhancement */
    onCancelEnhanceNegativePrompt?: () => void
    /** Ref for the main prompt textarea (for undo-friendly value setting) */
    promptTextareaRef?: React.RefObject<HTMLTextAreaElement | null>
    /** Ref for the negative prompt textarea (for undo-friendly value setting) */
    negativePromptTextareaRef?: React.RefObject<HTMLTextAreaElement | null>
}

export const PromptComposer = React.memo(function PromptComposer({
    prompt,
    onPromptChange,
    negativePrompt = "",
    onNegativePromptChange,
    isGenerating = false,
    maxLength = 2000,
    promptHistory = [],
    onSelectHistory,
    suggestions = [],
    onAddSuggestion,
    className,
    isEnhancingPrompt = false,
    onEnhancePrompt,
    onCancelEnhancePrompt,
    isEnhancingNegativePrompt = false,
    onEnhanceNegativePrompt,
    onCancelEnhanceNegativePrompt,
    promptTextareaRef,
    negativePromptTextareaRef,
}: PromptComposerProps) {
    const [showNegative, setShowNegative] = React.useState(false)
    const [showHistory, setShowHistory] = React.useState(false)
    const internalPromptRef = React.useRef<HTMLTextAreaElement>(null)
    const internalNegativePromptRef = React.useRef<HTMLTextAreaElement>(null)

    // Use provided refs or fall back to internal refs
    const textareaRef = promptTextareaRef ?? internalPromptRef
    const negativeTextareaRef = negativePromptTextareaRef ?? internalNegativePromptRef


    const characterCount = prompt.length
    const isNearLimit = characterCount > maxLength * 0.9

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Ctrl/Cmd + Enter
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault()
            // Parent should handle submission
        }
    }

    const clearPrompt = () => {
        onPromptChange("")
        textareaRef.current?.focus()
    }

    return (
        <div className={`space-y-3 ${className || ""}`} data-testid="prompt-composer">
            {/* Main Prompt */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label
                        htmlFor="prompt"
                        className="text-sm font-medium flex items-center gap-2"
                    >
                        <Wand2 className="h-3.5 w-3.5 text-primary" />
                        Prompt
                    </Label>
                    <div className="flex items-center gap-1">
                        {promptHistory.length > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setShowHistory(!showHistory)}
                                        data-testid="history-toggle"
                                    >
                                        <History className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Recent prompts</TooltipContent>
                            </Tooltip>
                        )}
                        <span
                            className={`text-xs tabular-nums ${isNearLimit ? "text-destructive" : "text-muted-foreground"}`}
                            data-testid="character-count"
                        >
                            {characterCount}/{maxLength}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        id="prompt"
                        placeholder="Describe the image you want to create..."
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isGenerating || isEnhancingPrompt}
                        maxLength={maxLength}
                        className="min-h-24 resize-none pr-8 pb-10 bg-background/50 border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
                        data-testid="prompt-input"
                    />
                    {prompt && !isGenerating && !isEnhancingPrompt && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6 opacity-50 hover:opacity-100"
                            onClick={clearPrompt}
                            data-testid="clear-prompt"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    {onEnhancePrompt && onCancelEnhancePrompt && (
                        <EnhanceButton
                            isEnhancing={isEnhancingPrompt}
                            disabled={!prompt.trim() || isGenerating}
                            onEnhance={onEnhancePrompt}
                            onCancel={onCancelEnhancePrompt}
                        />
                    )}
                </div>

                {/* Prompt History Dropdown */}
                {showHistory && promptHistory.length > 0 && (
                    <div
                        className="rounded-md border border-border bg-popover p-2 space-y-1"
                        data-testid="prompt-history"
                    >
                        {promptHistory.slice(0, 5).map((historyPrompt, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                className="w-full justify-start text-left text-sm h-auto p-2"
                                onClick={() => {
                                    onSelectHistory?.(historyPrompt)
                                    setShowHistory(false)
                                }}
                            >
                                <span className="line-clamp-2">{historyPrompt}</span>
                            </Button>
                        ))}
                    </div>
                )}

                {/* Suggestion Chips */}
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5" data-testid="suggestions">
                        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-1" />
                        {suggestions.map((suggestion, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                                onClick={() => onAddSuggestion?.(suggestion)}
                            >
                                + {suggestion}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Negative Prompt (Collapsible) */}
            {onNegativePromptChange && (
                <Collapsible open={showNegative} onOpenChange={setShowNegative}>
                    <CollapsibleTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between text-muted-foreground hover:text-foreground"
                            data-testid="negative-prompt-toggle"
                        >
                            <span className="text-xs">Negative Prompt</span>
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${showNegative ? "rotate-180" : ""}`}
                            />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                        <div className="relative">
                            <Textarea
                                ref={negativeTextareaRef}
                                placeholder="What to avoid in the image..."
                                value={negativePrompt}
                                onChange={(e) => onNegativePromptChange(e.target.value)}
                                disabled={isGenerating || isEnhancingNegativePrompt}
                                className="min-h-16 resize-none pb-10 bg-background/50 border-border/50 text-sm"
                                data-testid="negative-prompt-input"
                            />
                            {onEnhanceNegativePrompt && onCancelEnhanceNegativePrompt && (
                                <EnhanceButton
                                    isEnhancing={isEnhancingNegativePrompt}
                                    disabled={!prompt.trim() || isGenerating}
                                    onEnhance={onEnhanceNegativePrompt}
                                    onCancel={onCancelEnhanceNegativePrompt}
                                />
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    )
})
