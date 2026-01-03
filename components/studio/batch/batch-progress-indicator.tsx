"use client"

/**
 * BatchProgressIndicator - Shows progress of active batch job
 * Displays progress bar, counts, and cancel button
 */

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { BatchJob } from "@/hooks/queries/use-batch-generation"
import { Loader2, X } from "lucide-react"
import * as React from "react"

export interface BatchProgressIndicatorProps {
    /** The batch job to display */
    batchJob: BatchJob
    /** Callback when cancel is clicked */
    onCancel?: () => void
    /** Whether cancel is in progress */
    isCancelling?: boolean
    /** Additional class names */
    className?: string
}

export const BatchProgressIndicator = React.memo(function BatchProgressIndicator({
    batchJob,
    onCancel,
    isCancelling = false,
    className,
}: BatchProgressIndicatorProps) {
    const { status, completedCount, failedCount, totalCount } = batchJob
    const isActive = status === "pending" || status === "processing"
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    // Calculate time remaining
    const remaining = totalCount - completedCount - failedCount
    const estimatedSeconds = remaining * 15
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60)
    const timeRemaining = estimatedMinutes < 60
        ? `${estimatedMinutes}m remaining`
        : `${(estimatedMinutes / 60).toFixed(1)}h remaining`

    const statusText = {
        pending: "Starting...",
        processing: `${completedCount}/${totalCount} complete`,
        completed: `Completed (${completedCount}/${totalCount})`,
        cancelled: `Cancelled (${completedCount}/${totalCount})`,
        failed: `Failed (${failedCount} errors)`,
    }

    const statusColor = {
        pending: "text-muted-foreground",
        processing: "text-primary",
        completed: "text-emerald-500",
        cancelled: "text-yellow-500",
        failed: "text-destructive",
    }

    return (
        <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-card/80 border border-border/50 ${className || ""}`}
            data-testid="batch-progress-indicator"
        >
            {/* Status icon */}
            {isActive && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}

            {/* Progress section */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-medium ${statusColor[status]}`}>
                        {statusText[status]}
                    </span>
                    {isActive && (
                        <span className="text-xs text-muted-foreground">
                            {timeRemaining}
                        </span>
                    )}
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>

            {/* Cancel button - only for active batches */}
            {isActive && onCancel && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isCancelling}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    data-testid="cancel-batch-button"
                >
                    {isCancelling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                        </>
                    )}
                </Button>
            )}

            {/* Failed count indicator */}
            {failedCount > 0 && (
                <span className="text-xs text-destructive">
                    {failedCount} failed
                </span>
            )}
        </div>
    )
})
