"use client"

/**
 * LowBalanceWarningDialog - Warning dialog shown before generation
 * when the estimated cost will significantly deplete the user's balance.
 *
 * Uses AlertDialog pattern for confirmation flow.
 */

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Wallet } from "lucide-react"

export interface LowBalanceWarningDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean
    /** Callback when dialog is closed/cancelled */
    onClose: () => void
    /** Callback when user confirms to proceed anyway */
    onConfirm: () => void
    /** Current pollen balance */
    currentBalance: string | null
    /** Estimated cost of this generation */
    estimatedCost: string | null
    /** Remaining balance after generation */
    remainingBalance: string | null
    /** Whether this will completely deplete balance (can't afford) */
    cannotAfford?: boolean
    /** Model name for display */
    modelName?: string
    /** Whether it's a batch generation */
    isBatch?: boolean
    /** Number of images in batch */
    batchCount?: number
}

export function LowBalanceWarningDialog({
    isOpen,
    onClose,
    onConfirm,
    currentBalance,
    estimatedCost,
    remainingBalance,
    cannotAfford = false,
    modelName,
    isBatch = false,
    batchCount = 1,
}: LowBalanceWarningDialogProps) {
    const generationType = isBatch ? `${batchCount} images` : "generation"

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${cannotAfford ? "bg-yellow-500/10" : "bg-yellow-500/10"}`}>
                            {cannotAfford ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <Wallet className="h-5 w-5 text-yellow-500" />
                            )}
                        </div>
                        <AlertDialogTitle>
                            {cannotAfford ? "Insufficient Pollen" : "Low Balance Warning"}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 pt-2">
                            <p className="text-sm text-muted-foreground">
                                {cannotAfford ? (
                                    <>
                                        This {generationType} will cost more pollen than you have available.
                                        {modelName && (
                                            <span className="block mt-1 text-xs">
                                                Model: <span className="font-medium text-foreground">{modelName}</span>
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        This {generationType} will use most of your remaining pollen balance.
                                        {modelName && (
                                            <span className="block mt-1 text-xs">
                                                Model: <span className="font-medium text-foreground">{modelName}</span>
                                            </span>
                                        )}
                                    </>
                                )}
                            </p>

                            {/* Simple balance comparison */}
                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <p className="text-sm font-semibold">
                                    You have <span className="font-medium font-semibold tabular-nums text-yellow-600 dark:text-yellow-400">{currentBalance ?? "—"}</span> pollen
                                </p>
                                <p className="text-sm font-semibold">
                                    But this costs <span className={`font-medium font-semibold tabular-nums ${cannotAfford ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>{estimatedCost ?? "—"}</span> pollen
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {cannotAfford ? (
                                    <>You can top up your pollen at any time via <a className="text-blue-500 hover:underline" href="https://enter.pollinations.ai" target="_blank" rel="noopener noreferrer">enter.pollinations.ai</a></>
                                ) : (
                                    <>You can proceed, but consider topping up soon to avoid interruptions.</>
                                )}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={cannotAfford
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                        }
                    >
                        {cannotAfford ? "Try Anyway" : "Proceed"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
