"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/convex/_generated/api"
import { useConvexAuth, useMutation, useQuery, useAction } from "convex/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { SubscriptionBadge } from "@/components/subscription/subscription-badge"
import { UpgradeModal } from "@/components/studio/upgrade-modal"
import { Loader2, CreditCard } from "lucide-react"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"

/**
 * SettingsPage - User profile and subscription management.
 */
export default function SettingsPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
    const currentUser = useQuery(api.users.getCurrentUser)
    const updateUsername = useMutation(api.users.updateUsername)
    const { status: subscriptionStatus, isLoading: isSubscriptionLoading } = useSubscriptionStatus()
    const createPortalSession = useAction(api.stripe.createPortalSession)

    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    const [username, setUsername] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isPortalling, setIsPortalling] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Initialize username from user data
    useEffect(() => {
        if (currentUser?.username) {
            setUsername(currentUser.username)
        }
    }, [currentUser?.username])

    // Track changes
    useEffect(() => {
        const initialUsername = currentUser?.username ?? ""
        setHasChanges(username !== initialUsername && username.trim().length >= 3)
    }, [username, currentUser?.username])

    const handleSave = async () => {
        if (!hasChanges) return

        setIsSaving(true)
        try {
            await updateUsername({ username })
            toast.success("Username updated successfully!")
            setHasChanges(false)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update username"
            toast.error(message)
        } finally {
            setIsSaving(false)
        }
    }

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

    if (isAuthLoading || !mounted) {
        return (
            <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
                <Card className="animate-pulse">
                    <CardHeader>
                        <div className="h-6 w-24 bg-muted rounded" />
                        <div className="h-4 w-48 bg-muted rounded mt-2" />
                    </CardHeader>
                    <CardContent className="h-48 bg-muted/20 rounded-b-lg" />
                </Card>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please sign in to access your settings and subscription.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 p-6 max-w-2xl mx-auto py-12">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and subscription preferences.
                </p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        Update your public information.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={30}
                        />
                        <p className="text-xs text-muted-foreground">
                            This is your public display name. 3-30 characters.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger id="theme">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/10 pt-6">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="ml-auto"
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            {/* Subscription Settings */}
            <Card className="overflow-hidden border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Subscription
                    </CardTitle>
                    <CardDescription>
                        Manage your current plan and billing details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-2xl border bg-primary/5 border-primary/10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-muted-foreground">Current Plan</span>
                                <SubscriptionBadge />
                            </div>
                            <p className="font-semibold text-lg">
                                {subscriptionStatus === "pro" ? "Bloom Pro" : "Free Trial"}
                            </p>
                            <p className="text-sm text-muted-foreground max-w-[320px]">
                                {subscriptionStatus === "pro"
                                    ? "Enjoy unlimited generations and priority access to all models."
                                    : "Limited trial access. Upgrade to Pro for unlimited creative power."}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {subscriptionStatus === "pro" ? (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleManageBilling}
                                    disabled={isPortalling}
                                >
                                    {isPortalling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Manage Billing
                                </Button>
                            ) : (
                                <Button
                                    className="w-full shadow-lg shadow-primary/20"
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                >
                                    Upgrade to Pro
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t py-4">
                    <p className="text-xs text-muted-foreground text-center w-full">
                        Payments are securely processed by Stripe. Cancel anytime.
                    </p>
                </CardFooter>
            </Card>

            {/* Pollinations API Boost */}
            <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Boost Your Limits
                    </CardTitle>
                    <CardDescription>
                        Support the open-source project and unlock higher generation limits.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                                <Github className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">Star the Pollinations repo</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">
                                    Default keys have limits of around 300 images/month. Starring the repo can unlock higher limits (up to ~900 images/month) permanently.
                                </p>
                                <Button
                                    onClick={() => window.open("https://github.com/pollinations/pollinations", "_blank", "noopener,noreferrer")}
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    <Github className="w-4 h-4 mr-2" />
                                    Star on GitHub
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
            />
        </div>
    )
}