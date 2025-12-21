"use client"

/**
 * ImageToolbar - Floating action toolbar for image operations
 * Follows SRP: Only manages image action buttons
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Download,
    Copy,
    Check,
    Share2,
    Heart,
    MoreHorizontal,
    Maximize2,
    RefreshCw,
    ExternalLink,
} from "lucide-react"
import type { GeneratedImage } from "@/types/pollinations"

export interface ImageToolbarProps {
    /** Current image */
    image: GeneratedImage | null
    /** Whether image is favorited */
    isFavorited?: boolean
    /** Callback to download image */
    onDownload?: () => void
    /** Callback to copy image URL */
    onCopyUrl?: () => void
    /** Callback to share image */
    onShare?: () => void
    /** Callback to toggle favorite */
    onToggleFavorite?: () => void
    /** Callback to open in full screen */
    onFullscreen?: () => void
    /** Callback to regenerate with same settings */
    onRegenerate?: () => void
    /** Callback to open in new tab */
    onOpenInNewTab?: () => void
    /** Position of toolbar */
    position?: "top" | "bottom"
    /** Additional class names */
    className?: string
}

export function ImageToolbar({
    image,
    isFavorited = false,
    onDownload,
    onCopyUrl,
    onShare,
    onToggleFavorite,
    onFullscreen,
    onRegenerate,
    onOpenInNewTab,
    position = "top",
    className,
}: ImageToolbarProps) {
    const [copied, setCopied] = React.useState(false)

    if (!image) return null

    const handleCopyUrl = async () => {
        await onCopyUrl?.()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={cn(
                "absolute left-1/2 -translate-x-1/2 z-20",
                "flex items-center gap-1 p-1.5",
                "bg-background/90 backdrop-blur-md rounded-lg",
                "border border-border/50 shadow-lg",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                position === "top" ? "top-4" : "bottom-4",
                className
            )}
            data-testid="image-toolbar"
        >
            {/* Primary Actions */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onDownload}
                        data-testid="download-button"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Download (⌘S)</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyUrl}
                        data-testid="copy-button"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {copied ? "Copied!" : "Copy URL (⌘C)"}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8",
                            isFavorited && "text-red-500 hover:text-red-600"
                        )}
                        onClick={onToggleFavorite}
                        data-testid="favorite-button"
                    >
                        <Heart
                            className={cn("h-4 w-4", isFavorited && "fill-current")}
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {isFavorited ? "Remove from favorites" : "Add to favorites"}
                </TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-border/50 mx-0.5" />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onFullscreen}
                        data-testid="fullscreen-button"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Fullscreen (F)</TooltipContent>
            </Tooltip>

            {/* More Actions Dropdown */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                data-testid="more-button"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">More actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onRegenerate}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onOpenInNewTab}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in New Tab
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
