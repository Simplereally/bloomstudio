"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getModelDisplayName } from "@/lib/config/models"
import { getClampedAspectRatio } from "@/lib/image-models"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { Check, Copy, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

export interface ImageCardData {
    _id: string
    url: string
    prompt: string
    model: string
    width?: number
    height?: number
    seed?: number
    createdAt?: number
    _creationTime?: number
    generationParams?: {
        model?: string
        width?: number
        height?: number
        seed?: number
    }
    // Owner info for community feed
    ownerName?: string
    ownerPictureUrl?: string | null
}

interface ImageCardProps {
    image: ImageCardData
    /** Show user avatar and name overlay (for community feed) */
    showUser?: boolean
    /** Called when the card is clicked with the image data */
    onSelect?: (image: ImageCardData) => void
    /** Whether selection mode is active (shows checkbox) */
    selectionMode?: boolean
    /** Whether this card is currently selected */
    isSelected?: boolean
    /** Called when selection state changes */
    onSelectionChange?: (id: string, selected: boolean) => void
    className?: string
}

/**
 * A card component for displaying images in a masonry grid.
 * Shows a hover overlay with metadata similar to the lightbox component.
 * Optionally displays user avatar/name in the top-left corner for community feeds.
 */
export const ImageCard = React.memo(function ImageCard({
    image,
    showUser = false,
    onSelect,
    selectionMode = false,
    isSelected = false,
    onSelectionChange,
    className,
}: ImageCardProps) {
    const [copied, setCopied] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [optimisticFavorited, setOptimisticFavorited] = React.useState<boolean | null>(null)

    const { isSignedIn } = useUser()

    // Favorite state
    const isFavorited = useQuery(
        api.favorites.isFavorited,
        isSignedIn ? { imageId: image._id as Id<"generatedImages"> } : "skip"
    )
    const toggleFavorite = useMutation(api.favorites.toggle)

    // Use optimistic state if set, otherwise use server state
    const displayFavorited = optimisticFavorited ?? isFavorited ?? false

    const handleCopyPrompt = React.useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!image.prompt) return
        await navigator.clipboard.writeText(image.prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [image.prompt])

    const handleSelect = React.useCallback(() => {
        // In selection mode, clicking the card toggles selection
        if (selectionMode && onSelectionChange) {
            onSelectionChange(image._id, !isSelected)
            return
        }
        // Normal mode - open lightbox
        onSelect?.(image)
    }, [onSelect, image, selectionMode, isSelected, onSelectionChange])

    const handleCheckboxChange = React.useCallback((checked: boolean) => {
        onSelectionChange?.(image._id, checked)
    }, [onSelectionChange, image._id])

    // Stop propagation on checkbox click to prevent card click
    const handleCheckboxClick = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
    }, [])

    const handleToggleFavorite = React.useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isSignedIn) return

        // Optimistic update
        setOptimisticFavorited(!displayFavorited)

        try {
            await toggleFavorite({ imageId: image._id as Id<"generatedImages"> })
        } catch {
            // Revert on error
            setOptimisticFavorited(null)
        }
        // Clear optimistic state after server confirms
        setOptimisticFavorited(null)
    }, [isSignedIn, displayFavorited, toggleFavorite, image._id])

    const modelName = getModelDisplayName(image.generationParams?.model || image.model) || image.generationParams?.model || image.model
    const width = image.generationParams?.width || image.width || 1024
    const height = image.generationParams?.height || image.height || 1024
    const seed = image.generationParams?.seed || image.seed

    // Calculate clamped aspect ratio to prevent weird image sizes
    const clampedAspectRatio = getClampedAspectRatio(width, height)

    return (
        <div
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-lg",
                selectionMode && isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                className
            )}
            onClick={handleSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Selection checkbox - top right */}
            {selectionMode && (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div
                    className="absolute top-2 right-2 z-20"
                    onClick={handleCheckboxClick}
                >
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={handleCheckboxChange}
                        className="h-5 w-5 border-2 border-white bg-black/40 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                </div>
            )}

            {/* Image */}
            <Image
                src={image.url}
                alt={image.prompt || "Generated image"}
                width={width}
                height={height}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                style={{ aspectRatio: clampedAspectRatio }}
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
            />

            {/* User badge - top left (only on community feed) */}
            {showUser && image.ownerName && (
                <Link
                    href={`/profile/${image.ownerName}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "absolute top-2 left-2 flex items-center gap-2 px-2 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 transition-opacity duration-300 hover:bg-black/80 z-10",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}
                >
                    {image.ownerPictureUrl ? (
                        <Image
                            src={image.ownerPictureUrl}
                            alt={image.ownerName}
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">
                                {image.ownerName?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                        </div>
                    )}
                    <span className="text-xs font-medium text-white/90 max-w-[100px] truncate">
                        {image.ownerName}
                    </span>
                </Link>
            )}

            {/* Info overlay on hover - bottom */}
            <div
                className={cn(
                    "absolute bottom-0 inset-x-0 p-3 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-0"
                )}
            >
                <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        {/* Prompt */}
                        <p className="text-white text-sm font-medium leading-snug line-clamp-2 antialiased">
                            {image.prompt}
                        </p>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90">
                                <div className="w-1 h-1 rounded-full bg-primary" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">{modelName}</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[9px] font-medium">
                                <span className="text-white/40">Size</span>
                                <span className="font-mono">{width}×{height}</span>
                            </div>
                            {seed && seed !== -1 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[9px] font-medium">
                                    <span className="text-white/40">Seed</span>
                                    <span className="font-mono">{seed}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Copy button */}
                    <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors shrink-0"
                                onClick={handleCopyPrompt}
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-green-400" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-[200]">
                            <p className="font-medium">{copied ? "Copied!" : "Copy prompt"}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Favorite button */}
                    {isSignedIn && (
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-full backdrop-blur-md transition-colors shrink-0 border border-white/10",
                                        displayFavorited
                                            ? "bg-red-500/80 hover:bg-red-500 text-white"
                                            : "bg-white/10 hover:bg-white/20 text-white"
                                    )}
                                    onClick={handleToggleFavorite}
                                >
                                    <Heart
                                        className={cn(
                                            "h-3.5 w-3.5 transition-all",
                                            displayFavorited && "fill-current"
                                        )}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="z-[200]">
                                <p className="font-medium">
                                    {displayFavorited ? "Remove from favorites" : "Add to favorites"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    )
})
