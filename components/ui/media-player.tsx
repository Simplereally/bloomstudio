"use client"

/**
 * MediaPlayer - Unified component for rendering images and videos
 * 
 * Automatically detects content type and renders the appropriate element:
 * - <video> with native controls for video content
 * - <img> for image content
 */

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import * as React from "react"

// Video file extensions to detect
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i

/**
 * Determines if the content is video based on contentType or URL extension
 */
export function isVideoContent(contentType?: string, url?: string): boolean {
    if (contentType?.startsWith("video/")) return true
    if (url && VIDEO_EXTENSIONS.test(url)) return true
    return false
}

export interface MediaPlayerProps {
    /** Media URL to render */
    url: string
    /** Alt text for accessibility (used for both img alt and video aria-label) */
    alt?: string
    /** MIME type of the content (e.g., "video/mp4", "image/jpeg") */
    contentType?: string
    /** Poster/thumbnail image URL for video (shown before video plays) */
    poster?: string
    /** Whether to autoplay video (default: false) */
    autoPlay?: boolean
    /** Whether to show video controls (default: true for videos) */
    controls?: boolean
    /** Whether video should loop (default: false) */
    loop?: boolean
    /** Whether video should be muted (default: true to allow autoplay) */
    muted?: boolean
    /** Additional class names */
    className?: string
    /** Click handler */
    onClick?: (e: React.MouseEvent) => void
    /** Load handler - called when media is ready */
    onLoad?: (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void
    /** Error handler */
    onError?: () => void
    /** Whether to allow dragging (default: false) */
    draggable?: boolean
}

export const MediaPlayer = React.memo(function MediaPlayer({
    url,
    alt = "",
    contentType,
    poster,
    autoPlay = false,
    controls = true,
    loop = false,
    muted = true,
    className,
    onClick,
    onLoad,
    onError,
    draggable = false,
}: MediaPlayerProps) {
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)
    const videoRef = React.useRef<HTMLVideoElement>(null)

    const isVideo = isVideoContent(contentType, url)

    // Reset loading state when URL changes
    React.useEffect(() => {
        setIsLoading(true)
        setHasError(false)
    }, [url])

    const handleLoad = React.useCallback((e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
        setIsLoading(false)
        onLoad?.(e)
    }, [onLoad])

    const handleError = React.useCallback(() => {
        setIsLoading(false)
        setHasError(true)
        onError?.()
    }, [onError])

    // Handle video-specific load event
    const handleVideoLoadedData = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        handleLoad(e)
    }, [handleLoad])

    // Toggle play/pause on click for videos
    // Always handle explicitly to bypass browser's native delay (which waits to distinguish click vs double-click)
    // preventDefault stops the native video controls from also handling the click (which would cause double-toggle)
    const handleVideoClick = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play()
            } else {
                videoRef.current.pause()
            }
        }
        onClick?.(e)
    }, [onClick])

    if (hasError) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-muted/20 text-muted-foreground rounded cursor-pointer",
                    className
                )}
                onClick={onClick}
            >
                <span className="text-sm">Failed to load media</span>
            </div>
        )
    }

    if (isVideo) {
        return (
            <div className="relative">
                <video
                    ref={videoRef}
                    src={url}
                    poster={poster}
                    autoPlay={autoPlay}
                    controls={controls}
                    loop={loop}
                    muted={muted}
                    playsInline
                    preload="metadata"
                    aria-label={alt}
                    className={cn(
                        "w-auto h-auto object-contain",
                        className,
                        isLoading && "opacity-0"
                    )}
                    onClick={handleVideoClick}
                    onLoadedData={handleVideoLoadedData}
                    onError={handleError}
                    draggable={draggable}
                    data-testid="media-video"
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm pointer-events-none">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
            </div>
        )
    }

    // Image rendering
    return (
        <div className={cn("relative", className)}>
            <img
                src={url}
                alt={alt}
                className={cn(
                    "w-full h-full object-contain",
                    isLoading && "opacity-0"
                )}
                onClick={onClick}
                onLoad={handleLoad}
                onError={handleError}
                draggable={draggable}
                data-testid="media-image"
            />
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm pointer-events-none">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
})