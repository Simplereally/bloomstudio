"use client"

/**
 * MediaPlayer - Unified component for rendering images and videos
 * 
 * Automatically detects content type and renders the appropriate element:
 * - <video> with native controls for video content
 * - <img> for image content
 * 
 * Video playback is managed by the useMediaPlayer hook which properly
 * handles the asynchronous nature of play() to prevent race conditions.
 * 
 * Chrome compatibility: The hook uses a muted autoplay strategy to work
 * around Chrome's strict autoplay policy. The <video> element is rendered
 * without the `autoPlay` attribute; instead, the hook programmatically
 * calls play() after the video has loaded data. The video stays muted
 * during autoplay — the user can unmute via native controls.
 * 
 * Native controls: When `controls` is true, the component does not attach
 * a click handler to <video>, because the browser's native controls
 * already toggle play/pause on click. This prevents the double-toggle bug.
 */

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import * as React from "react"
import { useMediaPlayer } from "@/hooks/use-media-player"

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
    const isVideo = isVideoContent(contentType, url)

    const {
        isLoading,
        hasError,
        videoRef,
        handleLoad,
        handleError,
        handleVideoLoadedData,
        handleVideoClick,
    } = useMediaPlayer({
        url,
        isVideo,
        autoPlay,
        controls,
        onLoad,
        onError,
        onClick,
    })

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
            <div className={cn("relative", className)}>
                {/*
                  * Chrome autoplay compatibility notes:
                  * - No `autoPlay` attribute: the useMediaPlayer hook handles
                  *   programmatic play() with a muted-start strategy.
                  * - `preload="auto"` when autoPlay is requested: ensures Chrome
                  *   buffers enough data for immediate playback instead of just
                  *   fetching metadata headers.
                  * - Using `src` directly on <video> instead of <source>: React
                  *   does not call video.load() when <source> children change,
                  *   so dynamic URL updates wouldn't take effect. The `src`
                  *   attribute is detected as a prop change and triggers reload.
                  * - `muted` starts as true when autoPlay is requested: the video
                  *   stays muted to avoid Chrome pausing it. User can unmute via
                  *   native controls.
                  * - No onClick handler when controls=true: native controls
                  *   already handle play/pause; adding our own would double-toggle.
                  */}
                <video
                    ref={videoRef}
                    src={url}
                    poster={poster}
                    controls={controls}
                    loop={loop}
                    muted={autoPlay ? true : muted}
                    playsInline
                    preload={autoPlay ? "auto" : "metadata"}
                    aria-label={alt}
                    className={cn(
                        "w-full h-full object-contain",
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
            <Image
                src={url}
                alt={alt}
                fill
                sizes="100vw"
                className={cn(
                    "object-contain",
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
