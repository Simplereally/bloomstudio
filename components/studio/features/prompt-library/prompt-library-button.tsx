"use client"

/**
 * PromptLibraryButton - Button to open the prompt library modal
 *
 * Positioned alongside the enhance button in prompt inputs.
 * Also used in the lightbox for saving prompts.
 */

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Library } from "lucide-react"
import * as React from "react"

export interface PromptLibraryButtonProps {
    /** Callback when button is clicked */
    onClick: () => void
    /** Whether the button should be disabled */
    disabled?: boolean
    /** Variant of the button */
    variant?: "input" | "lightbox" | "standalone"
    /** Additional class names */
    className?: string
    /** Tooltip text override */
    tooltip?: string
}

/**
 * Button to open the prompt library modal
 * Has different visual styles for different contexts
 */
export function PromptLibraryButton({
    onClick,
    disabled = false,
    variant = "input",
    className,
    tooltip = "Prompt Library",
}: PromptLibraryButtonProps) {
    if (variant === "lightbox") {
        return (
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg",
                            className
                        )}
                        onClick={onClick}
                        disabled={disabled}
                    >
                        <Library className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[200]">
                    <p className="font-medium">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    if (variant === "standalone") {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn("h-8 w-8", className)}
                        onClick={onClick}
                        disabled={disabled}
                    >
                        <Library className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
        )
    }

    // Default: input variant - positioned in the prompt textarea
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClick}
                    disabled={disabled}
                    className={cn(
                        "group absolute bottom-2 right-10 z-10 h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted hover:text-foreground transition-all duration-200",
                        className
                    )}
                    data-testid="prompt-library-button"
                    aria-label={tooltip}
                >
                    <Library className="h-3.5 w-3.5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
                {tooltip}
            </TooltipContent>
        </Tooltip>
    )
}

export default PromptLibraryButton
