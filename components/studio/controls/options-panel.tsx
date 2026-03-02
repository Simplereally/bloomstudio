"use client"

/**
 * OptionsPanel - Generation options toggles (private mode, safety filter)
 */

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import * as React from "react"
import {
    Lock,
    Shield,
} from "lucide-react"

export interface GenerationOptions {
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
            className={cn(
                "flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted transition-colors",
                disabled && "opacity-50",
            )}
            data-testid={`option-${id}`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-md",
                        checked
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                    )}
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
    className,
}: OptionsPanelProps) {
    const handleOptionChange = (key: keyof GenerationOptions, value: boolean) => {
        onOptionsChange({ ...options, [key]: value })
    }

    return (
        <div 
            className={cn("divide-y divide-border/50", className)}
            data-testid="options-panel"
        >
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
    )
})
