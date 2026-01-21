"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SensitiveContentOverlay } from "@/components/ui/sensitive-content-overlay"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Check, Copy, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

// ---------------------------------------------------------------------------
// SelectionCheckbox
// ---------------------------------------------------------------------------

interface SelectionCheckboxProps {
    isSelected: boolean
    onCheckedChange: (checked: boolean) => void
    onClick: (e: React.MouseEvent) => void
}

export function SelectionCheckbox({ isSelected, onCheckedChange, onClick }: SelectionCheckboxProps) {
    return (
        <div className="absolute top-2 right-2 z-20" onClick={onClick}>
            <Checkbox
                checked={isSelected}
                onCheckedChange={onCheckedChange}
                className="h-5 w-5 border-2 border-white bg-black/40 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
        </div>
    )
}

// ---------------------------------------------------------------------------
// MediaContent
// ---------------------------------------------------------------------------

interface MediaContentProps {
    isVideo: boolean
    url: string
    prompt: string
    width: number
    height: number
    aspectRatio: number
    priority: boolean
    isLoaded: boolean
    onLoad: () => void
}

export function MediaContent({
    isVideo,
    url,
    prompt,
    width,
    height,
    aspectRatio,
    priority,
    isLoaded,
    onLoad,
}: MediaContentProps) {
    const mediaClassName = cn(
        "w-full object-cover transition-all duration-700",
        isLoaded ? "opacity-100" : "opacity-0"
    )

    if (isVideo) {
        return (
            <video
                src={url}
                muted
                loop
                playsInline
                autoPlay
                onCanPlay={onLoad}
                className={mediaClassName}
                style={{ aspectRatio }}
            />
        )
    }

    return (
        <Image
            src={url}
            alt={prompt ?? "Generated image"}
            width={width}
            height={height}
            className={mediaClassName}
            style={{ aspectRatio }}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            onLoad={onLoad}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
        />
    )
}

// ---------------------------------------------------------------------------
// UserBadge & UserAvatar
// ---------------------------------------------------------------------------

interface UserAvatarProps {
    ownerName: string
    ownerPictureUrl: string | null | undefined
}

function UserAvatar({ ownerName, ownerPictureUrl }: UserAvatarProps) {
    if (ownerPictureUrl) {
        return (
            <Image
                src={ownerPictureUrl}
                alt={ownerName}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
            />
        )
    }

    return (
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">
                {ownerName.charAt(0).toUpperCase() || "?"}
            </span>
        </div>
    )
}

interface UserBadgeProps {
    ownerName: string
    ownerPictureUrl: string | null | undefined
    isHovered: boolean
}

export function UserBadge({ ownerName, ownerPictureUrl, isHovered }: UserBadgeProps) {
    return (
        <Link
            href={`/profile/${ownerName}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "absolute top-2 left-2 flex items-center gap-2 px-2 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 transition-opacity duration-300 hover:bg-black/80 z-10",
                isHovered ? "opacity-100" : "opacity-0"
            )}
        >
            <UserAvatar ownerName={ownerName} ownerPictureUrl={ownerPictureUrl} />
            <span className="text-xs font-medium text-white/90 max-w-[100px] truncate">
                {ownerName}
            </span>
        </Link>
    )
}

// ---------------------------------------------------------------------------
// MetadataBadges
// ---------------------------------------------------------------------------

interface MetadataBadgesProps {
    modelName: string
    width: number
    height: number
    seed: number | undefined
}

export function MetadataBadges({ modelName, width, height, seed }: MetadataBadgesProps) {
    const showSeed = seed !== undefined && seed !== -1

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-[9px] font-bold uppercase tracking-wider">{modelName}</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[9px] font-medium">
                <span className="text-white/40">Size</span>
                <span className="font-mono">{width}×{height}</span>
            </div>
            {showSeed && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/90 text-[9px] font-medium">
                    <span className="text-white/40">Seed</span>
                    <span className="font-mono">{seed}</span>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// CopyPromptButton
// ---------------------------------------------------------------------------

interface CopyPromptButtonProps {
    isSignedIn: boolean
    copied: boolean
    onCopy: (e: React.MouseEvent) => void | Promise<void>
}

export function CopyPromptButton({ isSignedIn, copied, onCopy }: CopyPromptButtonProps) {
    if (isSignedIn) {
        return (
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors shrink-0"
                        onClick={(e) => void onCopy(e)}
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
        )
    }

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <Link
                    href="/sign-in"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white backdrop-blur-md transition-colors shrink-0 border border-white/10"
                    )}
                >
                    <Copy className="h-3.5 w-3.5" />
                </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-[200]">
                <p className="font-medium">Sign in to copy prompt</p>
            </TooltipContent>
        </Tooltip>
    )
}

// ---------------------------------------------------------------------------
// FavoriteButton
// ---------------------------------------------------------------------------

interface FavoriteButtonProps {
    isSignedIn: boolean
    isFavorited: boolean
    onToggle: (e: React.MouseEvent) => void | Promise<void>
}

export function FavoriteButton({ isSignedIn, isFavorited, onToggle }: FavoriteButtonProps) {
    if (isSignedIn) {
        return (
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full backdrop-blur-md transition-colors shrink-0 border border-white/10",
                            isFavorited
                                ? "bg-red-500/80 hover:bg-red-500 text-white"
                                : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                        onClick={(e) => void onToggle(e)}
                    >
                        <Heart
                            className={cn(
                                "h-3.5 w-3.5 transition-all",
                                isFavorited && "fill-current"
                            )}
                        />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-[200]">
                    <p className="font-medium">
                        {isFavorited ? "Remove from favorites" : "Add to favorites"}
                    </p>
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <Link
                    href="/sign-in"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white backdrop-blur-md transition-colors shrink-0 border border-white/10"
                    )}
                >
                    <Heart className="h-3.5 w-3.5" />
                </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-[200]">
                <p className="font-medium">Sign in to save favorites</p>
            </TooltipContent>
        </Tooltip>
    )
}

// ---------------------------------------------------------------------------
// InfoOverlay
// ---------------------------------------------------------------------------

interface InfoOverlayProps {
    isHovered: boolean
    prompt: string
    modelName: string
    width: number
    height: number
    seed: number | undefined
    isSignedIn: boolean
    copied: boolean
    isFavorited: boolean
    onCopy: (e: React.MouseEvent) => void | Promise<void>
    onToggleFavorite: (e: React.MouseEvent) => void | Promise<void>
}

export function InfoOverlay({
    isHovered,
    prompt,
    modelName,
    width,
    height,
    seed,
    isSignedIn,
    copied,
    isFavorited,
    onCopy,
    onToggleFavorite,
}: InfoOverlayProps) {
    return (
        <div
            className={cn(
                "absolute bottom-0 inset-x-0 p-3 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0"
            )}
        >
            <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <p className="text-white text-sm font-medium leading-snug line-clamp-2 antialiased">
                        {prompt}
                    </p>
                    <MetadataBadges
                        modelName={modelName}
                        width={width}
                        height={height}
                        seed={seed}
                    />
                </div>

                <CopyPromptButton
                    isSignedIn={isSignedIn}
                    copied={copied}
                    onCopy={onCopy}
                />

                <FavoriteButton
                    isSignedIn={isSignedIn}
                    isFavorited={isFavorited}
                    onToggle={onToggleFavorite}
                />
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Wrapper Components for Conditional Rendering
// ---------------------------------------------------------------------------

interface ImageCardContainerProps {
    selectionMode: boolean
    isSelected: boolean
    className: string | undefined
    onClick: () => void
    onMouseEnter: () => void
    onMouseLeave: () => void
    children: React.ReactNode
}

export function ImageCardContainer({
    selectionMode,
    isSelected,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    children,
}: ImageCardContainerProps) {
    return (
        <div
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-lg",
                selectionMode && isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                className
            )}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>
    )
}

interface ImageCardSensitiveOverlayProps {
    show: boolean
    isSignedIn: boolean
    onReveal: () => void
}

export function ImageCardSensitiveOverlay({ show, isSignedIn, onReveal }: ImageCardSensitiveOverlayProps) {
    if (!show) return null
    return <SensitiveContentOverlay onReveal={onReveal} isAllowedToReveal={isSignedIn} />
}

interface ImageCardSelectionCheckboxProps {
    show: boolean
    isSelected: boolean
    onCheckedChange: (checked: boolean) => void
    onClick: (e: React.MouseEvent) => void
}

export function ImageCardSelectionCheckbox({ show, isSelected, onCheckedChange, onClick }: ImageCardSelectionCheckboxProps) {
    if (!show) return null
    return <SelectionCheckbox isSelected={isSelected} onCheckedChange={onCheckedChange} onClick={onClick} />
}

interface ImageCardLoadingSkeletonProps {
    show: boolean
    aspectRatio: number
}

export function ImageCardLoadingSkeleton({ show, aspectRatio }: ImageCardLoadingSkeletonProps) {
    if (!show) return null
    return <Skeleton className="absolute inset-0 z-10 bg-muted" style={{ aspectRatio }} />
}

interface ImageCardUserBadgeProps {
    show: boolean
    ownerName: string | undefined
    ownerPictureUrl: string | null | undefined
    isHovered: boolean
}

export function ImageCardUserBadge({ show, ownerName, ownerPictureUrl, isHovered }: ImageCardUserBadgeProps) {
    if (!show || !ownerName) return null
    return <UserBadge ownerName={ownerName} ownerPictureUrl={ownerPictureUrl} isHovered={isHovered} />
}
