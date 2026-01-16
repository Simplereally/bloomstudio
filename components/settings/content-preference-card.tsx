"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { Eye, EyeOff, ShieldAlert, Check, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ContentPreferenceCard() {
    const preference = useQuery(api.users.getSensitiveContentPreference)
    const updatePreference = useMutation(api.users.updateSensitiveContentPreference)

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

    if (!preference) {
        return <ContentPreferenceCardSkeleton />
    }

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">Content Visibility</CardTitle>
                <CardDescription className="text-base text-muted-foreground/80">
                    Control how sensitive content is displayed in your feeds.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}

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

function ContentPreferenceCardSkeleton() {
    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded mt-2 animate-pulse" />
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}
