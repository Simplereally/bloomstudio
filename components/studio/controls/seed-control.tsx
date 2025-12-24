"use client"

/**
 * SeedControl - Seed input with random generator and history
 * Follows SRP: Only manages seed value input
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Check, Copy, Dice6, Lock, Unlock } from "lucide-react"
import * as React from "react"

export interface SeedControlProps {
    /** Current seed value (-1 for random) */
    seed: number
    /** Callback when seed changes */
    onSeedChange: (seed: number) => void
    /** Whether seed is locked for iteration */
    isLocked?: boolean
    /** Callback when lock state changes */
    onLockChange?: (locked: boolean) => void
    /** Whether input is disabled */
    disabled?: boolean
    /** Additional class names */
    className?: string
}

export const SeedControl = React.memo(function SeedControl({
    seed,
    onSeedChange,
    isLocked = false,
    onLockChange,
    disabled = false,
    className,
}: SeedControlProps) {
    const [copied, setCopied] = React.useState(false)

    const generateRandomSeed = () => {
        const newSeed = Math.floor(Math.random() * 2147483647)
        onSeedChange(newSeed)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === "" || value === "-") {
            onSeedChange(-1)
        } else {
            const numValue = parseInt(value, 10)
            if (!isNaN(numValue)) {
                onSeedChange(Math.max(-1, Math.min(2147483647, numValue)))
            }
        }
    }

    const copySeed = async () => {
        if (seed !== -1) {
            await navigator.clipboard.writeText(seed.toString())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const isRandom = seed === -1

    return (
        <div className={`space-y-2 ${className || ""}`} data-testid="seed-control">
            <div className="flex items-center justify-between">
                <Label htmlFor="seed" className="text-sm font-medium flex items-center gap-2">
                    <Dice6 className="h-3.5 w-3.5 text-primary" />
                    Seed
                </Label>
                {!isRandom && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Fixed
                    </span>
                )}
            </div>

            <div className="flex gap-1.5">
                <div className="relative flex-1">
                    <Input
                        id="seed"
                        type="number"
                        placeholder="Random"
                        value={isRandom ? "" : seed}
                        onChange={handleInputChange}
                        disabled={disabled}
                        min={-1}
                        max={2147483647}
                        className={`pr-8 text-sm bg-background/50 border-border/50 ${isLocked ? "border-primary/50 bg-primary/5" : ""}`}
                        data-testid="seed-input"
                    />
                    {!isRandom && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                    onClick={copySeed}
                                    disabled={disabled}
                                    data-testid="copy-seed"
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                {copied ? "Copied!" : "Copy seed"}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0 h-9 w-9"
                            onClick={generateRandomSeed}
                            disabled={disabled}
                            data-testid="random-seed"
                        >
                            <Dice6 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Generate random seed</TooltipContent>
                </Tooltip>

                {onLockChange && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant={isLocked ? "secondary" : "outline"}
                                size="icon"
                                className={`shrink-0 h-9 w-9 ${isLocked ? "border-primary/50 text-primary" : ""}`}
                                onClick={() => onLockChange(!isLocked)}
                                disabled={disabled || isRandom}
                                data-testid="lock-seed"
                            >
                                {isLocked ? (
                                    <Lock className="h-4 w-4" />
                                ) : (
                                    <Unlock className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {isLocked ? "Unlock seed" : "Lock seed for iteration"}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {isRandom && (
                <p className="text-xs text-muted-foreground">
                    A random seed will be used for each generation
                </p>
            )}
        </div>
    )
})
