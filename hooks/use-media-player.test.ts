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

        it("prevents default event behavior", async () => {
            const { result } = renderHook(() =>
                useMediaPlayer({ url: "https://example.com/video.mp4", isVideo: true })
            )

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick(mockEvent)
            })

            expect(mockEvent.preventDefault).toHaveBeenCalled()
        })

        it("calls onClick callback when provided (no video ref)", async () => {
            const onClick = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
                    onClick,
                })
            )

            const mockEvent = {
                preventDefault: vi.fn(),
            } as unknown as React.MouseEvent

            await act(async () => {
                await result.current.handleVideoClick(mockEvent)
            })

            expect(onClick).toHaveBeenCalledWith(mockEvent)
        })

        it("calls play() when video is paused", async () => {
            const onClick = vi.fn()
            const { result } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
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
                await result.current.handleVideoClick(mockEvent)
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
                await result.current.handleVideoClick(mockEvent)
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
                await result.current.handleVideoClick(mockEvent)
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
                await result.current.handleVideoClick(mockEvent)
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
                playClickPromise = result.current.handleVideoClick(mockEvent)
            })

            // Now change the mock to be "playing"
            Object.defineProperty(mockVideo, "paused", { value: false, writable: true })

            // Click again to pause while play() is still pending
            const pauseClickPromise = act(async () => {
                await result.current.handleVideoClick(mockEvent)
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

    describe("callback stability", () => {
        it("maintains stable callback references across renders", () => {
            const { result, rerender } = renderHook(() =>
                useMediaPlayer({
                    url: "https://example.com/video.mp4",
                    isVideo: true,
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
    })
})
