"use client"

import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Crown, Sparkles, Clock } from "lucide-react"
import { UpgradeModal } from "@/components/studio/upgrade-modal"
import { memo } from "react"
import { SubscriptionStatus } from "@/hooks/use-subscription-status"

interface SubscriptionBadgeViewProps {
    status: SubscriptionStatus | undefined
    isLoading: boolean
    timeLeft?: string
    isUpgradeModalOpen: boolean
    onUpgradeClick: () => void
    onCloseUpgradeModal: () => void
}

/**
 * Dumb component that just renders the subscription status UI.
 */
export const SubscriptionBadgeView = memo(function SubscriptionBadgeView({
    status,
    isLoading,
    timeLeft,
    isUpgradeModalOpen,
    onUpgradeClick,
    onCloseUpgradeModal,
}: SubscriptionBadgeViewProps) {
    if (isLoading) {
        return (
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted/50" />
        )
    }

    if (!status) return null

    if (status === "pro") {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(
                            "cursor-default border-primary/50 bg-primary/10 text-primary font-bold px-2 py-0.5",
                            "hover:bg-primary/20 transition-all duration-300",
                            "shadow-[0_0_15px_-3px_rgba(var(--primary),0.25)]",
                            "animate-in fade-in zoom-in duration-500"
                        )}
                    >
                        <Crown className="w-3 h-3 mr-1 fill-current" />
                        PRO
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] p-3">
                    <div className="space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-primary">
                            <Sparkles className="w-3.5 h-3.5" />
                            Pro Subscription
                        </p>
                        <p className="text-xs text-muted-foreground">
                            You have full access to all models and features. Thank you for supporting Bloom Studio!
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        )
    }

    if (status === "trial") {
        return (
            <>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="outline"
                            onClick={onUpgradeClick}
                            className={cn(
                                "cursor-pointer border-amber-500/50 bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5",
                                "hover:bg-amber-500/20 transition-all duration-300 hover:scale-105 active:scale-95",
                                "animate-in fade-in slide-in-from-right-2 duration-500"
                            )}
                        >
                            <Clock className="w-3 h-3 mr-1" />
                            TRIAL{timeLeft ? `: ${timeLeft}` : ""}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] p-3">
                        <div className="space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                                <Clock className="w-3.5 h-3.5" />
                                Trial Period
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Your trial gives you 24 hours of full access. Upgrade to Pro to keep creating after it ends!
                            </p>
                            <p className="text-[10px] font-medium text-amber-600/80 dark:text-amber-500/80 pt-1">
                                Click to upgrade now
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
                <UpgradeModal
                    isOpen={isUpgradeModalOpen}
                    onClose={onCloseUpgradeModal}
                />
            </>
        )
    }

    // Default or Expired
    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="secondary"
                        onClick={onUpgradeClick}
                        className={cn(
                            "cursor-pointer font-bold px-2 py-0.5",
                            "hover:bg-primary hover:text-primary-foreground transition-all duration-300",
                            "animate-pulse hover:animate-none"
                        )}
                    >
                        UPGRADE
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] p-3">
                    <div className="space-y-1">
                        <p className="font-bold text-primary">Upgrade to Pro</p>
                        <p className="text-xs text-muted-foreground">
                            Your trial has ended. Upgrade to Pro for just $5/mo to continue generating images.
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={onCloseUpgradeModal}
            />
        </>
    )
})
