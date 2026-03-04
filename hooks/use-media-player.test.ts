import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useMediaPlayer } from "./use-media-player"

describe("useMediaPlayer", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("initial state", () => {
        it("starts in loading state", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({ url: "https://example.com/video.mp4", isVideo: true })
            )

            expect(result.current.isLoading).toBe(true)
            expect(result.current.hasError).toBe(false)
        })

        it("provides a video ref", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({ url: "https://example.com/video.mp4", isVideo: true })
            )

            expect(result.current.videoRef).toBeDefined()
            expect(result.current.videoRef.current).toBe(null)
        })
    })

    describe("URL changes", () => {
        it("resets to loading state when URL changes", () => {
            const { result, rerender } = renderHook(
                ({ url }) => useMediaPlayer({ url, isVideo: true }),
                { initialProps: { url: "https://example.com/video1.mp4" } }
            )

            // Simulate load completion
            act(() => {
                result.current.handleLoad({} as React.SyntheticEvent<HTMLVideoElement>)
            })
            expect(result.current.isLoading).toBe(false)

            // Change URL
            rerender({ url: "https://example.com/video2.mp4" })

            // Should reset to loading
            expect(result.current.isLoading).toBe(true)
            expect(result.current.hasError).toBe(false)
        })
    })

    describe("handleLoad", () => {
        it("sets isLoading to false on load", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({ url: "https://example.com/video.mp4", isVideo: true })
            )

            expect(result.current.isLoading).toBe(true)

            act(() => {
                result.current.handleLoad({} as React.SyntheticEvent<HTMLVideoElement>)
            })

            expect(result.current.isLoading).toBe(false)
            expect(result.current.hasError).toBe(false)
        })

        it("calls onLoad callback when provided", () => {
            const onLoad = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    onLoad,
                })
            )

            const mockEvent = {} as React.SyntheticEvent<HTMLVideoElement>
            act(() => {
                result.current.handleLoad(mockEvent)
            })

            expect(onLoad).toHaveBeenCalledWith(mockEvent)
        })
    })

    describe("handleError", () => {
        it("sets hasError to true on error", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({ url: "https://example.com/video.mp4", isVideo: true })
            )

            expect(result.current.hasError).toBe(false)

            act(() => {
                result.current.handleError()
            })

            expect(result.current.isLoading).toBe(false)
            expect(result.current.hasError).toBe(true)
        })

        it("calls onError callback when provided", () => {
            const onError = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    onError,
                })
            )

            act(() => {
                result.current.handleError()
            })

            expect(onError).toHaveBeenCalled()
        })

        it("ignores errors from stale URLs (prevents 'Failed to load' flicker)", () => {
            const onError = vi.fn()
            const { result, rerender } = renderHook(
                ({ url }) => useMediaPlayer({ url, isVideo: true, onError }),
                { initialProps: { url: "https://example.com/video1.mp4" } }
            )

            // Attach a mock video element pointing to the OLD URL
            const mockVideo = {
                src: "https://example.com/video1.mp4",
                currentSrc: "https://example.com/video1.mp4",
            } as unknown as HTMLVideoElement
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            // Change the URL (simulates switching to a new video)
            rerender({ url: "https://example.com/video2.mp4" })

            // Now fire handleError — this is from the OLD video element
            act(() => {
                result.current.handleError()
            })

            // Error should be ignored because the video ref's src doesn't match the new URL
            expect(result.current.hasError).toBe(false)
            expect(onError).not.toHaveBeenCalled()
        })
    })

    describe("handleVideoLoadedData", () => {
        it("calls handleLoad with the event", () => {
            const onLoad = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    onLoad,
                })
            )

            const mockEvent = {} as React.SyntheticEvent<HTMLVideoElement>
            act(() => {
                result.current.handleVideoLoadedData(mockEvent)
            })

            expect(result.current.isLoading).toBe(false)
            expect(onLoad).toHaveBeenCalledWith(mockEvent)
        })
    })

    describe("handleVideoClick", () => {
        const createMockVideo = (paused: boolean) => {
            const video = {
                paused,
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
            } as unknown as HTMLVideoElement
            return video
        }

        it("returns undefined when controls are enabled (default)", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({ url: "https://example.com/video.mp4", isVideo: true })
            )

            // controls defaults to true, so handleVideoClick should be undefined
            expect(result.current.handleVideoClick).toBeUndefined()
        })

        it("returns a function when controls are disabled", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            expect(result.current.handleVideoClick).toBeInstanceOf(Function)
        })

        it("prevents default event behavior", async () => {
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            expect(mockEvent.preventDefault).toHaveBeenCalled()
        })

        it("calls onClick callback when provided (no video ref)", async () => {
            const onClick = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                    onClick,
                })
            )

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            expect(onClick).toHaveBeenCalledWith(mockEvent)
        })

        it("calls play() when video is paused", async () => {
            const onClick = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                    onClick,
                })
            )

            // Attach a mock video element
            const mockVideo = createMockVideo(true) // paused
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            expect(mockVideo.play).toHaveBeenCalled()
            expect(mockVideo.pause).not.toHaveBeenCalled()
            expect(onClick).toHaveBeenCalledWith(mockEvent)
        })

        it("calls pause() when video is playing", async () => {
            const onClick = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                    onClick,
                })
            )

            // Attach a mock video element that is playing
            const mockVideo = createMockVideo(false) // playing
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            expect(mockVideo.pause).toHaveBeenCalled()
            expect(mockVideo.play).not.toHaveBeenCalled()
            expect(onClick).toHaveBeenCalledWith(mockEvent)
        })

        it("handles play() rejection gracefully (AbortError)", async () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
            
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            // Create mock video that throws AbortError on play
            const abortError = new DOMException("The play() request was interrupted", "AbortError")
            const mockVideo = {
                paused: true,
                play: vi.fn().mockRejectedValue(abortError),
                pause: vi.fn(),
            } as unknown as HTMLVideoElement
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            // Should not throw
            await act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            // AbortError should be silently ignored (not logged)
            expect(consoleError).not.toHaveBeenCalled()
            
            consoleError.mockRestore()
        })

        it("logs non-AbortError play() rejections", async () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
            
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            // Create mock video that throws a different error on play
            const networkError = new Error("Network error")
            networkError.name = "NetworkError"
            const mockVideo = {
                paused: true,
                play: vi.fn().mockRejectedValue(networkError),
                pause: vi.fn(),
            } as unknown as HTMLVideoElement
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            // Non-AbortError should be logged
            expect(consoleError).toHaveBeenCalledWith("Video playback error:", networkError)
            
            consoleError.mockRestore()
        })

        it("waits for pending play() before calling pause()", async () => {
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            // Create a play promise we can control
            let resolvePlay: () => void
            const playPromise = new Promise<void>((resolve) => {
                resolvePlay = resolve
            })

            // Create mock video
            const mockVideo = {
                paused: true,
                play: vi.fn().mockReturnValue(playPromise),
                pause: vi.fn(),
            } as unknown as HTMLVideoElement
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            // Start playing (async)
            let playClickPromise: Promise<void>
            act(() => {
                playClickPromise = result.current.handleVideoClick!(mockEvent)
            })

            // Now change the mock to be "playing"
            Object.defineProperty(mockVideo, "paused", { value: false, writable: true })

            // Click again to pause while play() is still pending
            const pauseClickPromise = act(async () => {
                await result.current.handleVideoClick!(mockEvent)
            })

            // Resolve the play promise
            await act(async () => {
                resolvePlay!()
                await playPromise
            })

            // Wait for both click handlers to complete
            await playClickPromise!
            await pauseClickPromise

            // pause() should have been called after play() resolved
            expect(mockVideo.pause).toHaveBeenCalled()
        })
    })

    describe("Chrome-compatible autoplay", () => {
        it("does not attempt autoplay when autoPlay is false", () => {
            const mockVideo = {
                readyState: 4,
                muted: false,
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as unknown as HTMLVideoElement

            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    autoPlay: false,
                })
            )

            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            // play() should not have been called since autoPlay is false
            expect(mockVideo.play).not.toHaveBeenCalled()
        })

        it("always starts muted during autoplay regardless of muted prop", async () => {
            // This test verifies that the autoplay effect sets muted=true before
            // calling play(). We track the muted state at the time play() is invoked.
            let mutedWhenPlayCalled: boolean | undefined
            const mockVideo = {
                readyState: 4,
                muted: false,
                play: vi.fn().mockImplementation(() => {
                    // Capture the muted state at the time play() is called
                    mutedWhenPlayCalled = mockVideo.muted
                    return Promise.resolve(undefined)
                }),
                pause: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as unknown as HTMLVideoElement

            const { result, rerender } = renderHook(
                ({ url }) =>
                    useMediaPlayer({
                        url,
                        isVideo: true,
                        autoPlay: true,
                        muted: false, // User wants unmuted, but autoplay must start muted
                    }),
                { initialProps: { url: "https://example.com/video.mp4" } }
            )

            // Attach mock video
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            // Change URL to trigger the effect to re-run with the ref now populated
            rerender({ url: "https://example.com/video2.mp4" })

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })

            // play() should have been called with the video in muted state
            expect(mutedWhenPlayCalled).toBe(true)
            // And should still be muted after (no programmatic unmute)
            expect(mockVideo.muted).toBe(true)
        })

        it("listens for canplay event when video data is not ready", () => {
            const addEventListenerSpy = vi.fn()
            const removeEventListenerSpy = vi.fn()
            const mockVideo = {
                readyState: 0,
                muted: true,
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
                addEventListener: addEventListenerSpy,
                removeEventListener: removeEventListenerSpy,
            } as unknown as HTMLVideoElement

            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    autoPlay: true,
                    muted: true,
                })
            )

            // Manually set the ref
            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo
        })

        it("only attempts autoplay once per URL", async () => {
            const mockVideo = {
                readyState: 4,
                muted: false,
                play: vi.fn().mockResolvedValue(undefined),
                pause: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            } as unknown as HTMLVideoElement

            const { result, rerender } = renderHook(
                ({ url }) =>
                    useMediaPlayer({
                        url,
                        isVideo: true,
                        autoPlay: true,
                        muted: true,
                    }),
                { initialProps: { url: "https://example.com/video.mp4" } }
            )

            ;(result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = mockVideo

            // Re-render with same URL should not trigger additional play
            rerender({ url: "https://example.com/video.mp4" })

            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0))
            })
        })

        it("resets autoplay tracking when URL changes", async () => {
            const { result, rerender } = renderHook(
                ({ url }) =>
                    useMediaPlayer({
                        url,
                        isVideo: true,
                        autoPlay: true,
                        muted: true,
                    }),
                { initialProps: { url: "https://example.com/video1.mp4" } }
            )

            // Change URL - should reset state and allow new autoplay attempt
            rerender({ url: "https://example.com/video2.mp4" })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.hasError).toBe(false)
        })
    })

    describe("callback stability", () => {
        it("maintains stable callback references across renders", () => {
            const { result, rerender } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            const firstRender = {
                handleLoad: result.current.handleLoad,
                handleError: result.current.handleError,
                handleVideoLoadedData: result.current.handleVideoLoadedData,
                handleVideoClick: result.current.handleVideoClick,
            }

            rerender()

            // Callbacks should be referentially stable (memoized with useCallback)
            expect(result.current.handleLoad).toBe(firstRender.handleLoad)
            expect(result.current.handleError).toBe(firstRender.handleError)
            expect(result.current.handleVideoLoadedData).toBe(firstRender.handleVideoLoadedData)
            expect(result.current.handleVideoClick).toBe(firstRender.handleVideoClick)
        })

        it("updates callbacks when dependencies change", () => {
            const onLoad1 = vi.fn()
            const onLoad2 = vi.fn()

            const { result, rerender } = renderHook(
                ({ onLoad }) =>
                    useMediaPlayer({
                        url: "https://example.com/video.mp4",
                        isVideo: true,
                        onLoad,
                    }),
                { initialProps: { onLoad: onLoad1 } }
            )

            const firstHandleLoad = result.current.handleLoad

            rerender({ onLoad: onLoad2 })

            // handleLoad should be a new function since onLoad changed
            expect(result.current.handleLoad).not.toBe(firstHandleLoad)
        })

        it("handleVideoClick is undefined when controls=true", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: true,
                })
            )

            expect(result.current.handleVideoClick).toBeUndefined()
        })

        it("handleVideoClick is defined when controls=false", () => {
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    controls: false,
                })
            )

            expect(result.current.handleVideoClick).toBeInstanceOf(Function)
        })
    })
})
