"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Layers } from "lucide-react"
import * as React from "react"
import { type BatchModeSettings } from "./batch-mode-panel"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export interface BatchConfigButtonProps {
    settings: BatchModeSettings
    onSettingsChange: (settings: BatchModeSettings) => void
    disabled?: boolean
    className?: string
}

/**
 * BatchConfigButton - Quick access button for batch mode settings
 * Placed next to the main generate button for better accessibility
 */
export function BatchConfigButton({
    settings,
    onSettingsChange,
    disabled,
    className,
}: BatchConfigButtonProps) {
    const handleToggle = (enabled: boolean) => {
        onSettingsChange({ ...settings, enabled })
    }

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value)) {
            const clampedValue = Math.min(Math.max(value, 1), 1000)
            onSettingsChange({ ...settings, count: clampedValue })
        }
    }

    return (
        <Tooltip>
            <Popover modal={false}>
                <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                        <Button
                            variant={settings.enabled ? "secondary" : "outline"}
                            size="icon"
                            disabled={disabled}
                            className={cn(
                                "h-11 w-11 shrink-0 transition-all duration-300 border-border/40 relative overflow-hidden group/batch",
                                "hover:bg-muted/50 hover:border-primary/30",
                                settings.enabled && [
                                    "bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent",
                                    "text-primary border-primary/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
                                    "backdrop-blur-[2px]"
                                ],
                                className
                            )}
                        >
                            {/* Premium Sheen Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover/batch:opacity-100 transition-opacity duration-700 pointer-events-none">
                                <div className="absolute inset-x-[-150%] inset-y-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover/batch:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                            </div>

                            <Layers className={cn(
                                "h-[18px] w-[18px] transition-all duration-300 relative z-10", 
                                settings.enabled ? "scale-110 rotate-[2deg] opacity-100" : "opacity-70 group-hover/batch:opacity-100"
                            )} />
                            
                            {/* Status indicator dot */}
                            {settings.enabled && (
                                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 z-20">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-80"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
                                </span>
                            )}
                        </Button>
                    </TooltipTrigger>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-64 p-4 mb-2 bg-popover/95 backdrop-blur-xl border-primary/20 shadow-2xl animate-in zoom-in-95 duration-200 z-[100] pointer-events-auto" 
                    side="top" 
                    align="end" 
                    sideOffset={8}
                    // Prevent Vaul drawer from treating this as a drag target
                    data-vaul-no-drag
                    // Stop click propagation to prevent drawer from capturing it
                    onClick={(e) => e.stopPropagation()}
                    // CRITICAL: Prevent popover from closing on pointer/focus events
                    // When inside a Vaul drawer, the drawer's overlay causes spurious
                    // "outside" event detection, causing the popover to close when
                    // clicking interactive elements like the Switch.
                    // 
                    // By preventing these events, the user can interact with the popover
                    // content normally. The popover will still close when clicking
                    // the trigger button again.
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onFocusOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    {/* data-vaul-no-drag on this container to prevent Vaul from intercepting touch events */}
                    <div className="space-y-4 relative z-10" data-vaul-no-drag>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="batch-enabled-quick" className="text-sm font-semibold flex items-center gap-2 font-display">
                                    <Layers className="h-3.5 w-3.5" />
                                    Batch Mode
                                </Label>
                                {/* data-vaul-no-drag on Switch ensures click events reach it */}
                                <Switch
                                    id="batch-enabled-quick"
                                    checked={settings.enabled}
                                    onCheckedChange={handleToggle}
                                    data-vaul-no-drag
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Queue multiple images to generate in sequence.
                            </p>
                        </div>
                        
                        <div className={cn("space-y-2.5 transition-all duration-300", !settings.enabled && "opacity-40 grayscale pointer-events-none")}>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="batch-count-quick" className="text-xs font-medium text-muted-foreground">
                                    Number of images
                                </Label>
                                <span className="text-[10px] text-primary/70 font-bold tabular-nums bg-primary/5 px-1.5 py-0.5 rounded">
                                    {settings.count}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="batch-count-quick"
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={settings.count}
                                    onChange={handleCountChange}
                                    disabled={!settings.enabled}
                                    className="h-9 bg-muted/20 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/20 text-center text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <TooltipContent side="top">
                Batch Settings {settings.enabled ? `(${settings.count})` : ""}
            </TooltipContent>
        </Tooltip>
    )
}
