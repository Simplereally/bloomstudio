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
                        <div className={`p-2 rounded-full ${cannotAfford ? "bg-destructive/10" : "bg-amber-500/10"}`}>
                            {cannotAfford ? (
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            ) : (
                                <Wallet className="h-5 w-5 text-amber-500" />
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

                            {/* Balance breakdown */}
                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Current balance</span>
                                    <span className="font-medium tabular-nums">{currentBalance ?? "—"} pollen</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Estimated cost</span>
                                    <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
                                        {estimatedCost ? `-${estimatedCost}` : "—"} pollen
                                    </span>
                                </div>
                                <div className="border-t border-border pt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">After generation</span>
                                        <span className={`font-semibold tabular-nums ${cannotAfford
                                                ? "text-destructive"
                                                : "text-amber-600 dark:text-amber-400"
                                            }`}>
                                            {remainingBalance ?? "—"} pollen
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {cannotAfford ? (
                                    <>You can top up your pollen at any time via Polar.sh.</>
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
