"use client"

/**
 * EnhanceButton Component
 *
 * A magic wand button that toggles to a stop button during enhancement.
 * Positioned in the bottom-right corner of a text input container.
 */

import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Loader2, Square, Wand2 } from "lucide-react"
import * as React from "react"

export interface EnhanceButtonProps {
  /** Whether enhancement is currently in progress */
  isEnhancing: boolean
  /** Whether the button should be disabled */
  disabled?: boolean
  /** Callback when enhance is clicked */
  onEnhance: () => void
  /** Callback when stop is clicked */
  onCancel: () => void
  /** Additional class names */
  className?: string
}

/**
 * EnhanceButton provides a magic wand icon that morphs into a stop button
 * during the enhancement process. Designed to be positioned absolutely
 * within a relative container.
 */
export function EnhanceButton({
  isEnhancing,
  disabled = false,
  onEnhance,
  onCancel,
  className,
}: EnhanceButtonProps) {
  const handleClick = React.useCallback(() => {
    if (isEnhancing) {
      onCancel()
    } else {
      onEnhance()
    }
  }, [isEnhancing, onEnhance, onCancel])

  const tooltipText = isEnhancing ? "Stop enhancement" : "Enhance with AI"
  const isDisabled = disabled && !isEnhancing

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClick}
          disabled={isDisabled}
          className={`absolute bottom-2 right-2 z-10 h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 ${isEnhancing ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""} ${className || ""}`}
          data-testid={isEnhancing ? "enhance-button-stop" : "enhance-button-wand"}
          aria-label={tooltipText}
        >
          {isEnhancing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin absolute" />
              <Square className="h-3 w-3 opacity-0 group-hover:opacity-100" />
            </>
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  )
}
