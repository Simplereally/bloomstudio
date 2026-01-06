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
    ArrowRight,
    Check,
    ExternalLink,
    Github,
    Key,
    Loader2,
    Save
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

interface ApiKeyOnboardingModalProps {
    /** Callback when onboarding is complete */
    onComplete?: () => void
    /** Force open state for testing (overrides automatic behavior) */
    forceOpen?: boolean
    /** Callback when modal is closed (for controlled mode) */
    onClose?: () => void
}

/**
 * Displays a modal that guides authenticated users through obtaining and saving a Pollinations API key.
 *
 * The modal can operate in automatic mode (opens for authenticated users who do not yet have a saved API key)
 * or in controlled mode when `forceOpen` is provided. It validates the entered key, posts it to the server,
 * and invokes callbacks on completion or close.
 *
 * @param onComplete - Optional callback invoked after a key is successfully saved.
 * @param forceOpen - When provided, forces the modal's open state (enables controlled mode).
 * @param onClose - Optional callback invoked when the modal is closed (used in controlled mode).
 * @returns The onboarding modal JSX; in automatic mode returns `null` when the modal should not be shown. 
 */
export function ApiKeyOnboardingModal({ onComplete, forceOpen, onClose }: ApiKeyOnboardingModalProps) {
    const [apiKey, setApiKey] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [validationError, setValidationError] = React.useState<string | null>(null)
    const [isOpenInternal, setIsOpenInternal] = React.useState(false)

    // Controlled mode: forceOpen prop overrides internal state
    const isControlled = forceOpen !== undefined
    const isOpen = isControlled ? forceOpen : isOpenInternal

    // Check if user has an API key
    const { isAuthenticated, isLoading: isLoadingAuth } = useConvexAuth()
    const existingApiKey = useQuery(api.users.getPollinationsApiKey, isAuthenticated ? {} : "skip")
    const getOrCreateUser = useMutation(api.users.getOrCreateUser)

    // Use ref to avoid dependency array issues with Convex mutations
    const getOrCreateUserRef = React.useRef(getOrCreateUser)
    React.useEffect(() => {
        getOrCreateUserRef.current = getOrCreateUser
    }, [getOrCreateUser])

    // Initialize user on mount and show modal if no API key (only in automatic mode)
    React.useEffect(() => {
        if (isControlled) return // Skip in controlled mode
        if (isLoadingAuth || !isAuthenticated) return

        const initUser = async () => {
            try {
                await getOrCreateUserRef.current()
            } catch (error) {
                console.error("Error initializing user:", error)
            }
        }
        initUser()
    }, [isAuthenticated, isLoadingAuth, isControlled])

    // Show modal if user doesn't have an API key (only in automatic mode)
    React.useEffect(() => {
        if (isControlled) return // Skip in controlled mode

        if (isLoadingAuth || !isAuthenticated) {
            setIsOpenInternal(false)
            return
        }

        if (existingApiKey === null) {
            setIsOpenInternal(true)
        } else if (existingApiKey !== undefined) {
            setIsOpenInternal(false)
        }
    }, [existingApiKey, isAuthenticated, isLoadingAuth, isControlled])

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            setValidationError("Please enter your API key")
            return
        }

        if (!apiKey.trim().startsWith("sk_")) {
            setValidationError("This doesn't look right. Make sure you generated a \"Secret Key\" on the Pollinations site.")
            return
        }

        setValidationError(null)

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
            if (isControlled) {
                onClose?.()
            } else {
                setIsOpenInternal(false)
            }
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

    // In automatic mode: don't render if still loading or user has API key
    // In controlled mode: always render (visibility controlled by forceOpen prop)
    if (!isControlled && (existingApiKey === undefined || existingApiKey !== null)) {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogTitle className="sr-only">Connect to Pollinations</DialogTitle>
            <DialogContent
                className="sm:max-w-[480px] p-0 overflow-hidden border border-border/50 bg-card"
                showCloseButton={false}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-3">
                        <Check className="w-3 h-3" />
                        One-time setup
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                        Connect to Pollinations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Takes about 2 minutes. You'll only need to do this once.
                    </p>
                </div>

                {/* Steps */}
                <div className="px-6 pb-6 space-y-4">
                    {/* Step 1 */}
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                1
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground mb-2">
                                    Get a free API key from Pollinations
                                </p>

                                {/* Sub-steps */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <span className="text-foreground/80">
                                            Click the button below to open Pollinations
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <span className="text-foreground/80">
                                            Sign in with your <Github className="w-3.5 h-3.5 inline-block align-[-2px]" /> <span className="font-medium text-foreground">GitHub</span> account
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <span className="text-foreground/80">
                                            Click <span className="font-medium text-foreground">"Create API Key"</span>, select <span className="font-medium text-foreground">"Secret Key"</span>, then generate and copy it
                                        </span>
                                    </div>
                                </div>

                                {/* GitHub helper tip */}
                                <div className="mt-3 pt-3 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        <span className="font-medium text-foreground/70">No GitHub account?</span>{" "}
                                        <a
                                            href="https://github.com/signup"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Create one free
                                        </a>
                                        {" "}— you can sign up with your Google/Gmail account.
                                    </p>
                                </div>

                                {/* Action button */}
                                <Button
                                    onClick={handleOpenPollinationsPortal}
                                    variant="default"
                                    className="w-full h-10 font-medium mt-4"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Pollinations
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                2
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground mb-3">
                                    Paste your API key here
                                </p>

                                <Input
                                    type="password"
                                    placeholder="sk_xxx..."
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value)
                                        setValidationError(null)
                                    }}
                                    className={`h-10 font-mono text-sm bg-background/50 ${validationError ? 'border-destructive' : 'border-border'}`}
                                    autoComplete="off"
                                    spellCheck={false}
                                />

                                {validationError && (
                                    <p className="text-xs text-destructive mt-2">
                                        {validationError}
                                    </p>
                                )}

                                <Button
                                    onClick={handleSaveApiKey}
                                    disabled={isSaving || !apiKey.trim()}
                                    className="w-full h-10 font-medium mt-3"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save & Get Started
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-muted/20 border-t border-border/30 text-center">
                    <p className="text-xs text-muted-foreground">
                        Your API key is stored securely, encrypted, and never shared.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}