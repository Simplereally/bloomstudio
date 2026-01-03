"use client"

/**
 * ImageMetadata - Generation info display with badges
 * Follows SRP: Only displays metadata about generated images
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Copy,
    Check,
    ChevronDown,
    Clock,
    Cpu,
    Ruler,
    Hash,
    Sparkles,
} from "lucide-react"
import type { GeneratedImage } from "@/types/pollinations"

export interface ImageMetadataProps {
    /** Image to display metadata for */
    image: GeneratedImage | null
    /** Whether to show compact or expanded view */
    variant?: "compact" | "expanded"
    /** Callback to copy prompt */
    onCopyPrompt?: () => void
    /** Additional class names */
    className?: string
}

export function ImageMetadata({
    image,
    variant = "compact",
    onCopyPrompt,
    className,
}: ImageMetadataProps) {
    const [copied, setCopied] = React.useState(false)
    const [expanded, setExpanded] = React.useState(false)

    if (!image) return null

    const handleCopyPrompt = async () => {
        await navigator.clipboard.writeText(image.prompt)
        onCopyPrompt?.()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (variant === "compact") {
        return (
            <div
                className={cn(
                    "flex flex-wrap items-center gap-2 p-3",
                    "bg-gradient-to-t from-background/95 to-background/80",
                    "backdrop-blur-sm border-t border-border/50",
                    className
                )}
                data-testid="image-metadata"
            >
                {/* Prompt with copy */}
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm text-foreground line-clamp-1"
                        title={image.prompt}
                    >
                        {image.prompt}
                    </p>
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={handleCopyPrompt}
                            data-testid="copy-prompt"
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        {copied ? "Copied!" : "Copy prompt"}
                    </TooltipContent>
                </Tooltip>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        <Cpu className="h-3 w-3 mr-1" />
                        {image.params.model || "zimage"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        <Ruler className="h-3 w-3 mr-1" />
                        {image.params.width}×{image.params.height}
                    </Badge>
                    {image.params.seed && image.params.seed !== -1 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                            <Hash className="h-3 w-3 mr-1" />
                            {image.params.seed}
                        </Badge>
                    )}
                </div>
            </div>
        )
    }

    // Expanded variant with collapsible details
    return (
        <div
            className={cn(
                "p-4 space-y-3",
                "bg-card/50 backdrop-blur-sm border-t border-border/50",
                className
            )}
            data-testid="image-metadata"
        >
            {/* Prompt Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Prompt
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleCopyPrompt}
                        data-testid="copy-prompt"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 mr-1 text-green-500" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
                <p className="text-sm text-foreground">{image.prompt}</p>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                    <Cpu className="h-3 w-3 mr-1.5" />
                    {image.params.model || "zimage"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                    <Ruler className="h-3 w-3 mr-1.5" />
                    {image.params.width} × {image.params.height}
                </Badge>
                {image.params.seed && image.params.seed !== -1 && (
                    <Badge variant="outline" className="text-xs">
                        <Hash className="h-3 w-3 mr-1.5" />
                        Seed: {image.params.seed}
                    </Badge>
                )}
                {image.params.enhance && (
                    <Badge variant="default" className="text-xs bg-primary/15 text-primary hover:bg-primary/20">
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Enhanced
                    </Badge>
                )}
            </div>

            {/* Collapsible Full Parameters */}
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger
                    className={cn(
                        "flex items-center justify-between w-full",
                        "py-2 text-xs text-muted-foreground hover:text-foreground",
                        "transition-colors"
                    )}
                    data-testid="expand-params"
                >
                    <span>Full parameters</span>
                    <ChevronDown
                        className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            expanded && "rotate-180"
                        )}
                    />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div
                        className="mt-2 p-3 rounded-md bg-background/50 border border-border/50"
                        data-testid="full-params"
                    >
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(image.params, null, 2)}
                        </pre>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Generated at {formatTime(image.timestamp)}</span>
            </div>
        </div>
    )
}
