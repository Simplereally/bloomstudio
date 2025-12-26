"use client"

/**
 * API Key Onboarding Modal
 *
 * A sleek onboarding flow for users to set up their Pollinations API key.
 * Shows automatically when an authenticated user doesn't have an API key saved.
 */
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import {
    ExternalLink,
    Key,
    Loader2,
    Save
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

interface ApiKeyOnboardingModalProps {
    /** Callback when onboarding is complete */
    onComplete?: () => void
}

export function ApiKeyOnboardingModal({ onComplete }: ApiKeyOnboardingModalProps) {
    const [apiKey, setApiKey] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)

    // Check if user has an API key
    const { isAuthenticated, isLoading: isLoadingAuth } = useConvexAuth()
    const existingApiKey = useQuery(api.users.getPollinationsApiKey, isAuthenticated ? {} : "skip")
    const getOrCreateUser = useMutation(api.users.getOrCreateUser)

    // Use ref to avoid dependency array issues with Convex mutations
    const getOrCreateUserRef = React.useRef(getOrCreateUser)
    React.useEffect(() => {
        getOrCreateUserRef.current = getOrCreateUser
    }, [getOrCreateUser])

    // Initialize user on mount and show modal if no API key
    React.useEffect(() => {
        if (isLoadingAuth || !isAuthenticated) return

        const initUser = async () => {
            try {
                await getOrCreateUserRef.current()
            } catch (error) {
                console.error("Error initializing user:", error)
            }
        }
        initUser()
    }, [isAuthenticated, isLoadingAuth])

    // Show modal if user doesn't have an API key
    React.useEffect(() => {
        if (isLoadingAuth || !isAuthenticated) {
            setIsOpen(false)
            return
        }

        if (existingApiKey === null) {
            setIsOpen(true)
        } else if (existingApiKey !== undefined) {
            setIsOpen(false)
        }
    }, [existingApiKey, isAuthenticated, isLoadingAuth])

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            toast.error("Please enter your API key")
            return
        }

        if (!apiKey.trim().startsWith("sk_")) {
            toast.error("Invalid API key format. Key should start with sk_")
            return
        }

        setIsSaving(true)

        try {
            const response = await fetch("/api/user/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: apiKey.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to save API key")
            }

            toast.success("API key saved successfully!")
            setIsOpen(false)
            onComplete?.()
        } catch (error) {
            console.error("Error saving API key:", error)
            toast.error(error instanceof Error ? error.message : "Failed to save API key")
        } finally {
            setIsSaving(false)
        }
    }

    const handleOpenPollinationsPortal = () => {
        window.open("https://enter.pollinations.ai/", "_blank", "noopener,noreferrer")
    }

    // Don't render if still loading or user has API key
    if (existingApiKey === undefined || existingApiKey !== null) {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogTitle>Set up your Pollinations API key</DialogTitle>
            <DialogContent
                className="sm:max-w-[600px] p-0 overflow-hidden border border-border/50 bg-card"
                showCloseButton={false}
            >
                {/* Two-column layout */}
                <div className="flex">
                    {/* Step 1 - Left Card */}
                    <div className="flex-1 p-6 flex flex-col items-center text-center">
                        {/* Icon slot */}
                        <div className="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mb-4">
                            <ExternalLink className="w-6 h-6 text-primary" />
                        </div>
                        {/* Label slot */}
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Step 1</h3>
                        {/* Title slot */}
                        <p className="text-base font-semibold mb-4">Get your API key</p>
                        {/* Action slot - flex-1 absorbs height differences */}
                        <div className="flex-1 w-full flex flex-col justify-start">
                            <Button
                                onClick={handleOpenPollinationsPortal}
                                variant="default"
                                className="w-full h-10 font-medium"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Pollinations
                            </Button>
                        </div>
                        {/* Footer slot - mt-auto pushes to bottom */}
                        <p className="text-xs text-muted-foreground mt-auto pt-3">
                            Sign in and generate your API key.
                        </p>
                    </div>

                    {/* Vertical Divider */}
                    <div className="w-px bg-border/50" />

                    {/* Step 2 - Right Card */}
                    <div className="flex-1 p-6 flex flex-col items-center text-center">
                        {/* Icon slot */}
                        <div className="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mb-4">
                            <Key className="w-6 h-6 text-primary" />
                        </div>
                        {/* Label slot */}
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Step 2</h3>
                        {/* Title slot */}
                        <p className="text-base font-semibold mb-4">Paste your key</p>
                        {/* Action slot - flex-1 absorbs height differences */}
                        <div className="flex-1 w-full flex flex-col justify-start gap-3">
                            <Input
                                type="password"
                                placeholder="sk_xxx"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="h-10 font-mono text-sm bg-secondary/30 border-border text-center"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                        {/* Footer slot - mt-auto pushes to bottom, invisible to maintain alignment */}
                        <p className="text-xs text-muted-foreground mt-auto pt-3">
                            <Button
                                onClick={handleSaveApiKey}
                                disabled={isSaving || !apiKey.trim()}
                                className="w-full h-10 font-medium"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </>
                                )}
                            </Button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
