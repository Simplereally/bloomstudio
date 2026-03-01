"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { Eye, EyeOff, ShieldAlert, Check, Lock, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ============================================================
// Shared Section Components (extensible pattern)
// ============================================================

/**
 * A titled section within a settings card.
 * Reusable for any settings grouping — takes a title, description, and children.
 */
function SettingsSection({
    title,
    description,
    children,
}: {
    title: string
    description: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
            {children}
        </div>
    )
}

// ============================================================
// Main Card
// ============================================================

export function ContentPreferenceCard() {
    const preference = useQuery(api.users.getSensitiveContentPreference)
    const updatePreference = useMutation(api.users.updateSensitiveContentPreference)

    const defaultPrivate = useQuery(api.users.getDefaultPrivate)
    const updateDefaultPrivate = useMutation(api.users.updateDefaultPrivate)

    const handleValueChange = async (value: string) => {
        if (value !== "block" && value !== "blur" && value !== "allow") return

        try {
            await updatePreference({ showSensitiveContent: value })
            toast.success("Content preference updated")
        } catch (error) {
            toast.error("Failed to update preference")
            console.error(error)
        }
    }

    const handleDefaultPrivateChange = async (checked: boolean) => {
        try {
            await updateDefaultPrivate({ defaultPrivate: checked })
            toast.success(checked ? "New generations will default to private" : "New generations will default to public")
        } catch (error) {
            toast.error("Failed to update preference")
            console.error(error)
        }
    }

    if (preference === undefined || defaultPrivate === undefined) {
        return <ContentPreferenceCardSkeleton />
    }

    return (
        <div className="space-y-6">
            {/* Section 1: Generation Privacy */}
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold">Privacy & Safety</CardTitle>
                    <CardDescription className="text-base text-muted-foreground/80">
                        Control your default generation privacy and how sensitive content appears in your feeds.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Generation Defaults */}
                    <SettingsSection
                        title="Generation Defaults"
                        description="Set default behaviors for new image generations in the Studio."
                    >
                        <div
                            className={cn(
                                "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
                                defaultPrivate
                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                    : "border-border/40 bg-muted/20"
                            )}
                        >
                            <div className={cn(
                                "p-2.5 rounded-xl transition-colors duration-300 shrink-0",
                                defaultPrivate
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background/80 text-muted-foreground"
                            )}>
                                <Lock className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                                <Label
                                    htmlFor="default-private"
                                    className={cn(
                                        "font-bold text-base tracking-tight block cursor-pointer",
                                        defaultPrivate ? "text-primary" : "text-foreground"
                                    )}
                                >
                                    Private Mode by Default
                                </Label>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    New generations will default to private (unlisted). Private images skip content analysis and
                                    won't appear in the public gallery. You can still toggle per-generation in the Studio.
                                </p>
                            </div>

                            <Switch
                                id="default-private"
                                checked={defaultPrivate}
                                onCheckedChange={handleDefaultPrivateChange}
                                className="shrink-0 mt-0.5"
                                data-testid="switch-default-private"
                            />
                        </div>
                    </SettingsSection>

                    <Separator className="bg-border/40" />

                    {/* Content Visibility */}
                    <SettingsSection
                        title="Content Visibility"
                        description="Control how sensitive content is displayed in your feeds."
                    >
                        <RadioGroup
                            value={preference}
                            onValueChange={handleValueChange}
                            className="grid grid-cols-1 gap-4"
                        >
                            <PreferenceOption
                                id="block"
                                value="block"
                                icon={EyeOff}
                                iconColor="text-muted-foreground"
                                title="Hide Sensitive Content"
                                description="Do not show sensitive content at all in feeds. Maximum safety."
                                active={preference === "block"}
                            />

                            <PreferenceOption
                                id="blur"
                                value="blur"
                                icon={ShieldAlert}
                                iconColor="text-amber-500"
                                title="Blur Sensitive Content"
                                description="Blur sensitive content by default. Click to reveal when you're ready."
                                active={preference === "blur"}
                            />

                            <PreferenceOption
                                id="allow"
                                value="allow"
                                icon={Eye}
                                iconColor="text-primary"
                                title="Show All Content"
                                description="Always show sensitive content without masking. Use with caution."
                                active={preference === "allow"}
                            />
                        </RadioGroup>
                    </SettingsSection>
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================================
// Sub-components
// ============================================================

function PreferenceOption({
    id,
    value,
    icon: Icon,
    iconColor,
    title,
    description,
    active,
}: {
    id: string
    value: string
    icon: LucideIcon
    iconColor: string
    title: string
    description: string
    active: boolean
}) {
    return (
        <div className="relative">
            <RadioGroupItem value={value} id={id} className="sr-only" />
            <Label
                htmlFor={id}
                className={cn(
                    "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    active
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                        : "border-border/40 bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
                )}
            >
                <div className={cn(
                    "p-2.5 rounded-xl transition-colors duration-300",
                    active
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/80 " + iconColor
                )}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-1">
                    <span className={cn(
                        "font-bold text-base tracking-tight block",
                        active ? "text-primary" : "text-foreground"
                    )}>
                        {title}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>

                {active && (
                    <div className="mt-1">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="w-3 h-3" />
                        </div>
                    </div>
                )}
            </Label>
        </div>
    )
}

// ============================================================
// Skeleton
// ============================================================

function ContentPreferenceCardSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded mt-2 animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Generation Defaults skeleton */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="h-6 w-44 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-muted/10">
                            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-52 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                            </div>
                            <div className="w-11 h-6 rounded-full bg-muted animate-pulse shrink-0" />
                        </div>
                    </div>

                    <Separator className="bg-border/40" />

                    {/* Content Visibility skeleton */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-muted/10">
                                    <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
