"use client"

import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Loader2, CreditCard, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { UpgradeModal } from "@/components/studio/upgrade-modal"
import { cn } from "@/lib/utils"

export function SubscriptionCard() {
    const { status, isLoading } = useSubscriptionStatus()
    const createPortalSession = useAction(api.stripe.createPortalSession)
    const [isPortalling, setIsPortalling] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

    const isPro = status === "pro"

    const handleManageBilling = async () => {
        setIsPortalling(true)
        try {
            const { url } = await createPortalSession({
                returnUrl: window.location.href,
            })
            window.location.href = url
        } catch (error) {
            console.error("Portal error:", error)
            toast.error("Failed to open billing portal")
            setIsPortalling(false)
        }
    }

    if (isLoading) {
        return <SubscriptionCardSkeleton />
    }

    return (
        <>
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                Subscription Plan
                                {isPro && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                        PRO ACTIVE
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-base text-muted-foreground/80">
                                Manage your plan and billing preferences.
                            </CardDescription>
                        </div>
                        <div className="hidden sm:block">
                            <div className={cn(
                                "p-3 rounded-2xl",
                                isPro ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {isPro ? <ShieldCheck className="w-8 h-8" /> : <CreditCard className="w-8 h-8" />}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Current Plan Banner */}
                    <div className={cn(
                        "relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300",
                        isPro 
                            ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-lg shadow-primary/5" 
                            : "bg-muted/30 border-border/40"
                    )}>

                        
                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
                                <h3 className="text-3xl font-bold tracking-tight">
                                    {isPro ? "Professional" : "Free Tier"}
                                </h3>
                                <p className="text-muted-foreground max-w-[400px]">
                                    {isPro 
                                        ? "You're enjoying the full power of Pixelstream with priority access and premium features." 
                                        : "You're currently on our common entry tier. Upgrade to unlock the full creative potential."}
                                </p>
                            </div>
                            
                            {isPro ? (
                                <Button 
                                    variant="outline" 
                                    onClick={handleManageBilling} 
                                    disabled={isPortalling}
                                    className="min-w-[160px] h-11 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                                >
                                    {isPortalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                    Manage Billing
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => setIsUpgradeModalOpen(true)} 
                                    className="min-w-[180px] h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white shadow-xl shadow-indigo-500/20 font-bold text-base transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Zap className="w-5 h-5 mr-2 fill-current" />
                                    Upgrade to PRO
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2">
                            <div className="h-[1px] flex-1 bg-border/50" />
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Plan Benefits</h4>
                            <div className="h-[1px] flex-1 bg-border/50" />
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <FeatureItem included={true} text="Unlimited standard generations" />
                            <FeatureItem included={isPro} text="Priority high-speed processing" />
                            <FeatureItem included={isPro} text="Commercial usage rights" />
                            <FeatureItem included={isPro} text="Private generations (Unlisted)" />
                            <FeatureItem included={isPro} text="Early access to new models" />
                            <FeatureItem included={isPro} text="Beta feature participation" />
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
            />
        </>
    )
}

function FeatureItem({ included, text }: { included: boolean; text: string }) {
    return (
        <li className="flex items-center gap-4 group">
            <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-300",
                included ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground/40"
            )}>
                <Check className={cn("w-4 h-4", included ? "stroke-[3px]" : "stroke-[2px]")} />
            </div>
            <span className={cn(
                "text-sm font-medium transition-colors duration-300",
                included ? "text-foreground" : "text-muted-foreground/60"
            )}>
                {text}
            </span>
        </li>
    )
}

function SubscriptionCardSkeleton() {
    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="hidden sm:block">
                        <div className="w-14 h-14 bg-muted rounded-2xl animate-pulse" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Current Plan Banner Skeleton */}
                <div className="rounded-2xl p-8 border-2 border-border/40 bg-muted/10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-3 w-full">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-full max-w-[350px] bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-12 w-[180px] bg-muted rounded animate-pulse" />
                    </div>
                </div>

                {/* Features Grid Skeleton */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="h-[1px] flex-1 bg-border/50" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-[1px] flex-1 bg-border/50" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
