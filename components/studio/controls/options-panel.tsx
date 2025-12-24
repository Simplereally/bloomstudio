"use client"

/**
 * OptionsPanel - Collapsible advanced options section
 * Follows SRP: Only manages generation options toggles
 */

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
// Tooltip components available for future enhancement
// import {
//     Tooltip,
//     TooltipContent,
//     TooltipTrigger,
// } from "@/components/ui/tooltip"
import {
    ChevronDown,
    Info,
    Lock,
    Settings2,
    Shield,
    Sparkles,
} from "lucide-react"

export interface GenerationOptions {
    enhance: boolean
    private: boolean
    safe: boolean
}

export interface OptionsPanelProps {
    /** Current options */
    options: GenerationOptions
    /** Callback when options change */
    onOptionsChange: (options: GenerationOptions) => void
    /** Whether panel is disabled */
    disabled?: boolean
    /** Whether to start expanded */
    defaultExpanded?: boolean
    /** Additional class names */
    className?: string
}

interface OptionItemProps {
    id: string
    label: string
    description: string
    icon: React.ReactNode
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
}

function OptionItem({
    id,
    label,
    description,
    icon,
    checked,
    onCheckedChange,
    disabled,
}: OptionItemProps) {
    return (
        <div
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/30 transition-colors ${disabled ? "opacity-50" : ""}`}
            data-testid={`option-${id}`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`flex items-center justify-center w-7 h-7 rounded-md ${checked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                    {icon}
                </div>
                <div className="flex flex-col">
                    <Label
                        htmlFor={id}
                        className="text-sm font-medium cursor-pointer leading-none"
                    >
                        {label}
                    </Label>
                    <span className="text-xs text-muted-foreground mt-0.5">
                        {description}
                    </span>
                </div>
            </div>
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                data-testid={`switch-${id}`}
            />
        </div>
    )
}

export const OptionsPanel = React.memo(function OptionsPanel({
    options,
    onOptionsChange,
    disabled = false,
    defaultExpanded = false,
    className,
}: OptionsPanelProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

    const handleOptionChange = (key: keyof GenerationOptions, value: boolean) => {
        onOptionsChange({ ...options, [key]: value })
    }

    // Count active options
    const activeCount = Object.values(options).filter(Boolean).length

    return (
        <div className={`space-y-2 ${className || ""}`} data-testid="options-panel">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger
                    className={`flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors text-left`}
                    data-testid="options-trigger"
                >
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Advanced Options</span>
                        {activeCount > 0 && (
                                <span
                                    className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary`}
                                    data-testid="active-count"
                                >
                                {activeCount}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-1">
                    <div
                        className="rounded-lg border border-border/50 bg-background/50 divide-y divide-border/50"
                    >
                        <OptionItem
                            id="enhance"
                            label="AI Enhancement"
                            description="Improve prompt quality automatically"
                            icon={<Sparkles className="h-3.5 w-3.5" />}
                            checked={options.enhance}
                            onCheckedChange={(checked) => handleOptionChange("enhance", checked)}
                            disabled={disabled}
                        />

                        <OptionItem
                            id="private"
                            label="Private Mode"
                            description="Don't share in public gallery"
                            icon={<Lock className="h-3.5 w-3.5" />}
                            checked={options.private}
                            onCheckedChange={(checked) => handleOptionChange("private", checked)}
                            disabled={disabled}
                        />

                        <OptionItem
                            id="safe"
                            label="Safety Filter"
                            description="Block unsafe content generation"
                            icon={<Shield className="h-3.5 w-3.5" />}
                            checked={options.safe}
                            onCheckedChange={(checked) => handleOptionChange("safe", checked)}
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex items-start gap-2 mt-2 px-1">
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                            These options affect image generation behavior and privacy settings.
                        </p>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
})
