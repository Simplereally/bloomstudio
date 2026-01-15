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
     * 
     * Properly handles the async nature of video.play() to prevent
     * "The play() request was interrupted by a call to pause()" errors.
     */
    handleVideoClick: (e: React.MouseEvent) => Promise<void>
}

/**
 * Custom hook for managing media player state and video playback.
 * 
 * Handles:
 * - Loading and error states
 * - Video element ref management
 * - Safe play/pause toggling that prevents race conditions
 * 
 * The video play/pause logic properly handles the asynchronous nature of
 * video.play() to prevent "The play() request was interrupted by a call
 * to pause()" errors.
 * 
 * @see https://developer.chrome.com/blog/play-request-was-interrupted
 * 
 * @example
 * ```tsx
 * const { isLoading, hasError, videoRef, handleVideoClick } = useMediaPlayer({
 *   url: videoUrl,
 *   isVideo: true,
 *   onLoad: () => console.log('Loaded!'),
 * });
 * ```
 */
export function useMediaPlayer({
    url,
    isVideo,
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

    // Reset loading state and cancel pending operations when URL changes
    React.useEffect(() => {
        setIsLoading(true)
        setHasError(false)
        // Clear any pending play promise reference on URL change
        playPromiseRef.current = null
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

    /**
     * Safely toggle video play/pause state.
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
    }, [onClick])

    return {
        isLoading,
        hasError,
        videoRef,
        handleLoad,
        handleError,
        handleVideoLoadedData,
        handleVideoClick,
    }
}
