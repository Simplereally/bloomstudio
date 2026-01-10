"use client"

/**
 * CollapsibleSection - Generic collapsible wrapper for studio panel sections
 * Allows users to collapse sections to save space in the sidebar
 */

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import * as React from "react"

export interface CollapsibleSectionProps {
    /** Section title */
    title: string
    /** Icon to display next to the title */
    icon?: React.ReactNode
    /** Content to render inside the collapsible */
    children: React.ReactNode
    /** Whether to start expanded */
    defaultExpanded?: boolean
    /** Additional class names for the outer container */
    className?: string
    /** Test id for the trigger */
    testId?: string
    /** Content to display on the right side of the header (e.g., controls, badges) - shown when expanded */
    rightContent?: React.ReactNode
    /** Content to display on the right side of the header when collapsed (e.g., selected value summary) */
    collapsedContent?: React.ReactNode
    /** Whether the section is disabled (non-interactive and visually dimmed) */
    disabled?: boolean
    /** Controlled expanded state */
    open?: boolean
    /** Callback when expanded state changes */
    onOpenChange?: (open: boolean) => void
}

export const CollapsibleSection = React.memo(function CollapsibleSection({
    title,
    icon,
    children,
    defaultExpanded = true,
    className,
    testId,
    rightContent,
    collapsedContent,
    disabled = false,
    open: controlledOpen,
    onOpenChange,
}: CollapsibleSectionProps) {
    const [internalOpen, setInternalOpen] = React.useState(defaultExpanded)

    const isControlled = controlledOpen !== undefined
    const isExpanded = isControlled ? controlledOpen : internalOpen

    const handleOpenChange = React.useCallback((open: boolean) => {
        if (!isControlled) {
            setInternalOpen(open)
        }
        onOpenChange?.(open)
    }, [isControlled, onOpenChange])

    return (
        <div
            className={`space-y-2 w-full min-w-0 overflow-x-hidden ${disabled ? "opacity-50 pointer-events-none" : ""} ${className || ""}`}
            data-testid={testId ? `${testId}-container` : undefined}
            aria-disabled={disabled}
        >
            <Collapsible open={isExpanded} onOpenChange={disabled ? undefined : handleOpenChange}>
                {/* Header row: trigger + rightContent side by side */}
                <div className="flex items-center gap-2 w-full">
                    <CollapsibleTrigger
                        className={`flex items-center gap-2 flex-1 min-w-0 py-2 px-1 rounded-sm hover:bg-muted transition-colors text-left ${disabled ? "cursor-not-allowed" : ""}`}
                        data-testid={testId ? `${testId}-trigger` : undefined}
                        disabled={disabled}
                    >
                        {icon && <span className="text-primary shrink-0">{icon}</span>}
                        <span className="text-sm font-medium truncate">{title}</span>
                        {/* When collapsed: show non-interactive summary badge */}
                        {!isExpanded && (collapsedContent || rightContent) && (
                            <div className="shrink-0 ml-auto">
                                {collapsedContent ?? rightContent}
                            </div>
                        )}
                        <ChevronRight
                            className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""} ${!isExpanded && (collapsedContent || rightContent) ? "" : "ml-auto"}`}
                        />
                    </CollapsibleTrigger>
                    {/* Interactive rightContent OUTSIDE the trigger button to avoid nested buttons */}
                    {isExpanded && rightContent && (
                        <div className="shrink-0">
                            {rightContent}
                        </div>
                    )}
                </div>

                <CollapsibleContent
                    className="pt-1 w-full min-w-0"
                    data-testid={testId ? `${testId}-content` : undefined}
                    forceMount
                    style={{ display: isExpanded ? undefined : 'none' }}
                >
                    {children}
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
})
