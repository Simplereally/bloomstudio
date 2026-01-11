"use client"

import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { UpgradeModal } from "@/components/studio/upgrade-modal"

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
        return <Card className="h-[300px] animate-pulse bg-muted/10 border-0" />
    }

    return (
        <>
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
                {isPro && (
                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <Sparkles className="w-32 h-32 fill-primary text-primary" />
                    </div>
                )}
                
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                Subscription
                                {isPro && <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">PRO</Badge>}
                            </CardTitle>
                            <CardDescription>
                                Manage your plan and billing preferences.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/30 rounded-xl p-6 border border-border/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="font-semibold text-lg">
                                {isPro ? "Professional Plan" : "Free Plan"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {isPro 
                                    ? "You have full access to all premium features." 
                                    : "You are currently on the limited free tier."}
                            </p>
                        </div>
                        
                        {isPro ? (
                            <Button variant="outline" onClick={handleManageBilling} disabled={isPortalling}>
                                {isPortalling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Manage Billing
                            </Button>
                        ) : (
                            <Button onClick={() => setIsUpgradeModalOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-primary/20">
                                <Zap className="w-4 h-4 mr-2 fill-current" />
                                Upgrade to Pro
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plan Features</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FeatureItem included={true} text="Unlimited standard generations" />
                            <FeatureItem included={isPro} text="Priority high-speed processing" />
                            <FeatureItem included={isPro} text="Commercial usage rights" />
                            <FeatureItem included={isPro} text="Private generations (Unlisted)" />
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
        <li className="flex items-center gap-3 text-sm">
            <div className={`
                flex items-center justify-center w-5 h-5 rounded-full 
                ${included ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}
            `}>
                <Check className="w-3 h-3" />
            </div>
            <span className={included ? "text-foreground" : "text-muted-foreground"}>
                {text}
            </span>
        </li>
    )
}
