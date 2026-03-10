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
    /** Handler for video metadata availability */
    handleVideoLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void
    /** Handler for video-specific loadeddata event */
    handleVideoLoadedData: (e: React.SyntheticEvent<HTMLVideoElement>) => void
    /** Handler for video canplay event */
    handleVideoCanPlay: (e: React.SyntheticEvent<HTMLVideoElement>) => void
    /** Handler for video playing event */
    handleVideoPlaying: (e: React.SyntheticEvent<HTMLVideoElement>) => void
    /**
     * Handler for video click events - safely toggles play/pause.
     * Returns undefined when native controls handle play/pause.
     */
    handleVideoClick: ((e: React.MouseEvent) => Promise<void>) | undefined
}

const AUTOPLAY_RETRY_DELAYS_MS = [180, 520]

function getMediaSource(element: HTMLImageElement | HTMLVideoElement | null) {
    if (!element) return ""

    if (element instanceof HTMLVideoElement) {
        return element.currentSrc || element.src
    }

    return element.src
}

function normalizeMediaUrl(src: string) {
    try {
        return new URL(src, window.location.origin).href
    } catch {
        return src
    }
}

/**
 * Custom hook for managing media player state and video playback.
 */
export function useMediaPlayer({
    url,
    isVideo,
    autoPlay = false,
    controls = true,
    onLoad,
    onError,
    onClick,
}: UseMediaPlayerProps): UseMediaPlayerReturn {
    const [isLoading, setIsLoading] = React.useState(true)
    const [hasError, setHasError] = React.useState(false)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)

    const playPromiseRef = React.useRef<Promise<void> | null>(null)
    const currentUrlRef = React.useRef(url)
    const autoplayAttemptVersionRef = React.useRef(0)
    const hasDispatchedLoadRef = React.useRef(false)
    const retryTimeoutRef = React.useRef<number | null>(null)

    currentUrlRef.current = url

    const clearRetryTimeout = React.useCallback(() => {
        if (retryTimeoutRef.current !== null) {
            window.clearTimeout(retryTimeoutRef.current)
            retryTimeoutRef.current = null
        }
    }, [])

    const isCurrentMediaElement = React.useCallback((element: HTMLImageElement | HTMLVideoElement | null) => {
        const src = getMediaSource(element)
        if (!src) return true

        return normalizeMediaUrl(src) === normalizeMediaUrl(currentUrlRef.current)
    }, [])

    React.useEffect(() => {
        setIsLoading(true)
        setHasError(false)
        playPromiseRef.current = null
        hasDispatchedLoadRef.current = false
        autoplayAttemptVersionRef.current += 1
        clearRetryTimeout()
    }, [clearRetryTimeout, url])

    React.useEffect(() => {
        return () => {
            clearRetryTimeout()
        }
    }, [clearRetryTimeout])

    const dispatchLoad = React.useCallback((e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
        const element = e.currentTarget as HTMLImageElement | HTMLVideoElement | null
        if (!isCurrentMediaElement(element)) {
            return
        }

        setIsLoading(false)

        if (!hasDispatchedLoadRef.current) {
            hasDispatchedLoadRef.current = true
            onLoad?.(e)
        }
    }, [isCurrentMediaElement, onLoad])

    const handleLoad = React.useCallback((e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
        dispatchLoad(e)
    }, [dispatchLoad])

    const handleError = React.useCallback(() => {
        const video = videoRef.current
        if (video && !isCurrentMediaElement(video)) {
            return
        }

        clearRetryTimeout()
        setIsLoading(false)
        setHasError(true)
        onError?.()
    }, [clearRetryTimeout, isCurrentMediaElement, onError])

    const handleVideoLoadedMetadata = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        dispatchLoad(e)
    }, [dispatchLoad])

    const handleVideoLoadedData = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        dispatchLoad(e)
    }, [dispatchLoad])

    const handleVideoCanPlay = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        dispatchLoad(e)
    }, [dispatchLoad])

    const handleVideoPlaying = React.useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        clearRetryTimeout()
        dispatchLoad(e)
    }, [clearRetryTimeout, dispatchLoad])

    React.useEffect(() => {
        if (!isVideo || !autoPlay) {
            return
        }

        const video = videoRef.current
        if (!video || !isCurrentMediaElement(video)) {
            return
        }

        const attemptVersion = autoplayAttemptVersionRef.current
        let cancelled = false
        let retryCount = 0

        const attemptAutoplay = async () => {
            if (cancelled || attemptVersion !== autoplayAttemptVersionRef.current) {
                return
            }

            const currentVideo = videoRef.current
            if (!currentVideo || !isCurrentMediaElement(currentVideo)) {
                return
            }

            if (currentVideo.paused === false && !currentVideo.ended) {
                setIsLoading(false)
                clearRetryTimeout()
                return
            }

            currentVideo.defaultMuted = true
            currentVideo.muted = true

            try {
                const playPromise = currentVideo.play()
                playPromiseRef.current = playPromise
                await playPromise

                if (!cancelled && attemptVersion === autoplayAttemptVersionRef.current) {
                    setIsLoading(false)
                    clearRetryTimeout()
                }
            } catch (error) {
                if (cancelled || attemptVersion !== autoplayAttemptVersionRef.current) {
                    return
                }

                if (error instanceof Error && error.name === "AbortError") {
                    return
                }

                if (error instanceof Error && error.name === "NotAllowedError") {
                    setIsLoading(false)
                    clearRetryTimeout()
                    return
                }

                if (retryCount < AUTOPLAY_RETRY_DELAYS_MS.length) {
                    const delay = AUTOPLAY_RETRY_DELAYS_MS[retryCount]
                    retryCount += 1
                    clearRetryTimeout()
                    retryTimeoutRef.current = window.setTimeout(() => {
                        void attemptAutoplay()
                    }, delay)
                    return
                }

                if (error instanceof Error) {
                    console.error("Video autoplay failed:", error)
                }

                setIsLoading(false)
            } finally {
                if (playPromiseRef.current) {
                    playPromiseRef.current = null
                }
            }
        }

        const handleCanPlay = () => {
            void attemptAutoplay()
        }

        const handlePlaying = () => {
            setIsLoading(false)
            clearRetryTimeout()
        }

        video.addEventListener("canplay", handleCanPlay)
        video.addEventListener("playing", handlePlaying)

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            void attemptAutoplay()
        }

        return () => {
            cancelled = true
            clearRetryTimeout()
            video.removeEventListener("canplay", handleCanPlay)
            video.removeEventListener("playing", handlePlaying)
        }
    }, [autoPlay, clearRetryTimeout, isCurrentMediaElement, isVideo, url])

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
            const playPromise = video.play()
            playPromiseRef.current = playPromise

            try {
                await playPromise
            } catch (error) {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Video playback error:", error)
                }
            } finally {
                if (playPromiseRef.current === playPromise) {
                    playPromiseRef.current = null
                }
            }
        } else {
            const pendingPlay = playPromiseRef.current
            if (pendingPlay) {
                try {
                    await pendingPlay
                } catch {
                    // Ignore - play was already aborted or failed.
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
        handleVideoLoadedMetadata,
        handleVideoLoadedData,
        handleVideoCanPlay,
        handleVideoPlaying,
        handleVideoClick: controls ? undefined : handleVideoClick,
    }
}
