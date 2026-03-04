"use client"

import * as React from "react"

/**
 * Props for the useMediaPlayer hook
 */
export interface UseMediaPlayerProps {
    /** Media URL - used to reset state when it changes */
    url: string
    /** Whether the content is video (vs image) */
    isVideo: boolean
    /** Whether the video should autoplay (default: false) */
    autoPlay?: boolean
    /** Whether the video should be muted (default: true) */
    muted?: boolean
    /** Whether native controls are enabled (default: true) */
    controls?: boolean
    /** Callback when media successfully loads */
    onLoad?: (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void
    /** Callback when media fails to load */
    onError?: () => void
    /** Optional click handler to call after play/pause toggle */
    onClick?: (e: React.MouseEvent) => void
}

/**
 * Return type for the useMediaPlayer hook
 */
export interface UseMediaPlayerReturn {
    /** Whether the media is currently loading */
    isLoading: boolean
    /** Whether the media failed to load */
    hasError: boolean
    /** Ref to attach to the video element */
    videoRef: React.RefObject<HTMLVideoElement | null>
    /** Handler for media load events */
    handleLoad: (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void
    /** Handler for media error events */
    handleError: () => void
    /** Handler for video-specific loadeddata event */
    handleVideoLoadedData: (e: React.SyntheticEvent<HTMLVideoElement>) => void
    /**
     * Handler for video click events - safely toggles play/pause.
     * Returns undefined when native controls handle play/pause.
     * 
     * Properly handles the async nature of video.play() to prevent
     * "The play() request was interrupted by a call to pause()" errors.
     */
    handleVideoClick: ((e: React.MouseEvent) => Promise<void>) | undefined
}

/**
 * Custom hook for managing media player state and video playback.
 * 
 * Handles:
 * - Loading and error states with synchronous URL tracking to prevent flicker
 * - Video element ref management
 * - Safe play/pause toggling that prevents race conditions
 * - Chrome-compatible autoplay (stays muted; user unmutes via controls)
 * 
 * The video play/pause logic properly handles the asynchronous nature of
 * video.play() to prevent "The play() request was interrupted by a call
 * to pause()" errors.
 * 
 * Chrome autoplay policy: When autoplay is requested, the video starts muted
 * (always allowed by Chrome) and stays muted. The user can unmute via the
 * native controls. This avoids the "1-second stall" caused by programmatic
 * unmuting, which makes Chrome re-evaluate its autoplay policy and pause.
 * 
 * Native controls: When `controls` is true, `handleVideoClick` is undefined
 * to prevent double-toggling playback (the browser's native controls already
 * handle play/pause on click).
 * 
 * @see https://developer.chrome.com/blog/play-request-was-interrupted
 * @see https://developer.chrome.com/blog/autoplay
 * 
 * @example
 * ```tsx
 * const { isLoading, hasError, videoRef, handleVideoClick } = useMediaPlayer({
 *   url: videoUrl,
 *   isVideo: true,
 *   autoPlay: true,
 *   muted: false,
 *   controls: true,
 *   onLoad: () => console.log('Loaded!'),
 * });
 * ```
 */
export function useMediaPlayer({
    url,
    isVideo,
    autoPlay = false,
    muted = true,
    controls = true,
    onLoad,
    onError,
    onClick,
}: UseMediaPlayerProps): UseMediaPlayerReturn {
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    
    // Track pending play operation to prevent race conditions
    // This prevents the "play() interrupted by pause()" error
    const playPromiseRef = React.useRef<Promise<void> | null>(null)

    // Track whether we've already attempted autoplay for this URL
    const autoPlayAttemptedRef = React.useRef<string | null>(null)

    // Synchronously track the current URL to prevent stale error/load callbacks
    // from firing for a previous URL. The useEffect reset runs asynchronously
    // (after render), so without this ref, handleError from a previous URL's
    // <video> can set hasError=true for the new URL, causing the "Failed to load
    // media" flash.
    const currentUrlRef = React.useRef(url)
    currentUrlRef.current = url

    // Reset loading state and cancel pending operations when URL changes
    React.useEffect(() => {
        setIsLoading(true)
        setHasError(false)
        // Clear any pending play promise reference on URL change
        playPromiseRef.current = null
        autoPlayAttemptedRef.current = null
    }, [url])

    const handleLoad = React.useCallback((e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
        // Ignore load events from a stale URL (previous video/image still firing).
        // e.currentTarget may be null during teardown, so guard defensively.
        const el = e.currentTarget as HTMLVideoElement | HTMLImageElement | null
        if (el) {
            const elSrc = el instanceof HTMLVideoElement
                ? el.currentSrc || el.src
                : (el as HTMLImageElement).src
            if (elSrc && !elSrc.includes(currentUrlRef.current)) return
        }

        setIsLoading(false)
        onLoad?.(e)
    }, [onLoad])

    const handleError = React.useCallback(() => {
        // Ignore error events from a stale URL.
        // When the URL changes, the old <video>/<img> may fire an error as it's
        // torn down. Without this guard the error sets hasError=true for the new
        // URL, causing the "Failed to load media" flash.
        const video = videoRef.current
        if (video) {
            const src = video.currentSrc || video.src
            if (src && !src.includes(currentUrlRef.current)) return
        }

        setIsLoading(false)
        setHasError(true)
        onError?.()
    }, [onError])

    // Handle video-specific load event
    const handleVideoLoadedData = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        handleLoad(e)
    }, [handleLoad])

    /**
     * Programmatic autoplay — muted-start strategy.
     * 
     * Chrome's autoplay policy (since Chrome 66) blocks unmuted autoplay unless
     * the user has a high Media Engagement Index (MEI) for the site. The HTML
     * `autoplay` attribute is particularly unreliable because Chrome processes it
     * at element mount time, when the user gesture token from the original click
     * may already be consumed by intermediate UI (Dialog/Modal opening).
     * 
     * Strategy:
     * 1. Always start playback muted (guaranteed to succeed in all browsers)
     * 2. Leave the video muted — the user can unmute via native controls
     * 
     * Previous versions tried to unmute programmatically after play() succeeded.
     * This caused Chrome to re-evaluate its autoplay policy and pause the video
     * after ~1 second, resulting in the "1-second stall" regression.
     */
    React.useEffect(() => {
        if (!isVideo || !autoPlay) return
        
        const video = videoRef.current
        if (!video) return

        // Only attempt autoplay once per URL
        if (autoPlayAttemptedRef.current === url) return
        autoPlayAttemptedRef.current = url

        const attemptAutoplay = async () => {
            // Always start muted to guarantee autoplay succeeds.
            // The user can unmute via native controls at any time.
            try {
                video.muted = true
                const playPromise = video.play()
                playPromiseRef.current = playPromise
                await playPromise
                playPromiseRef.current = null
            } catch (error) {
                playPromiseRef.current = null
                // AbortError is expected if the element was removed during play()
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Video autoplay failed:', error)
                }
            }
        }

        // If the video already has data, attempt immediately
        // readyState >= 2 (HAVE_CURRENT_DATA) means enough data to play
        if (video.readyState >= 2) {
            attemptAutoplay()
        } else {
            // Wait for enough data before attempting playback
            const onCanPlay = () => {
                attemptAutoplay()
            }
            video.addEventListener("canplay", onCanPlay, { once: true })
            return () => {
                video.removeEventListener("canplay", onCanPlay)
            }
        }
    }, [isVideo, autoPlay, url])

    /**
     * Safely toggle video play/pause state.
     * 
     * Only used when native controls are disabled (controls=false).
     * When native controls are enabled, the browser handles play/pause
     * via its built-in UI, and adding our own click handler would cause
     * a double-toggle.
     * 
     * The video.play() method returns a Promise that resolves when playback starts.
     * If pause() is called before that Promise resolves, the browser throws an AbortError.
     * 
     * This handler:
     * 1. Tracks pending play() Promises via a ref
     * 2. Waits for pending play() to resolve before calling pause()
     * 3. Catches and ignores AbortError (expected when rapidly clicking)
     */
    const handleVideoClick = React.useCallback(async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!isVideo) {
            onClick?.(e)
            return
        }
        const video = videoRef.current
        if (!video) {
            onClick?.(e)
            return
        }

        if (video.paused) {
            // Start playback and track the Promise
            const playPromise = video.play()
            playPromiseRef.current = playPromise
            
            try {
                await playPromise
            } catch (error) {
                // AbortError is expected if pause() was called while play() was pending
                // This can happen with rapid clicking or component unmount
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Video playback error:', error)
                }
            } finally {
                // Clear the ref once resolved/rejected
                if (playPromiseRef.current === playPromise) {
                    playPromiseRef.current = null
                }
            }
        } else {
            // Before pausing, wait for any pending play() to resolve
            // This prevents the "interrupted by pause()" error
            const pendingPlay = playPromiseRef.current
            if (pendingPlay) {
                try {
                    await pendingPlay
                } catch {
                    // Ignore - play was already aborted or failed
                }
                playPromiseRef.current = null
            }
            video.pause()
        }
        
        onClick?.(e)
    }, [isVideo, onClick])

    return {
        isLoading,
        hasError,
        videoRef,
        handleLoad,
        handleError,
        handleVideoLoadedData,
        // When native controls are enabled, don't attach our click handler
        // to avoid double-toggling playback. The browser's native controls
        // already handle play/pause on click.
        handleVideoClick: controls ? undefined : handleVideoClick,
    }
}
