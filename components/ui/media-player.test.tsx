/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { MediaPlayer, isVideoContent } from "./media-player"
import * as React from "react"

// Mock next/image
vi.mock("next/image", () => ({
    default: ({ src, alt, fill: _fill, sizes: _sizes, ...props }: { src: string | { src: string }; alt: string; fill?: boolean; sizes?: string } & React.ImgHTMLAttributes<HTMLImageElement>) => {
        void _fill
        void _sizes
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={typeof src === "string" ? src : src.src} alt={alt} {...props} />
    },
}))

describe("isVideoContent", () => {
    it("returns true for video content types", () => {
        expect(isVideoContent("video/mp4")).toBe(true)
        expect(isVideoContent("video/webm")).toBe(true)
    })

    it("returns true for video extensions in URL", () => {
        expect(isVideoContent(undefined, "https://example.com/video.mp4")).toBe(true)
        expect(isVideoContent(undefined, "https://example.com/movie.mov")).toBe(true)
        expect(isVideoContent(undefined, "https://example.com/clip.webm")).toBe(true)
    })

    it("returns false for image content types", () => {
        expect(isVideoContent("image/jpeg")).toBe(false)
        expect(isVideoContent("image/png")).toBe(false)
    })

    it("returns false for image extensions in URL", () => {
        expect(isVideoContent(undefined, "https://example.com/image.jpg")).toBe(false)
        expect(isVideoContent(undefined, "https://example.com/photo.png")).toBe(false)
    })
})

describe("MediaPlayer", () => {
    const imageUrl = "https://example.com/image.jpg"
    const videoUrl = "https://example.com/video.mp4"

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders an image by default", () => {
        render(<MediaPlayer url={imageUrl} alt="Test Image" />)
        const img = screen.getByTestId("media-image")
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute("src", imageUrl)
        expect(img).toHaveAttribute("alt", "Test Image")
    })

    it("renders a video when contentType is video", () => {
        render(<MediaPlayer url={videoUrl} alt="Test Video" contentType="video/mp4" />)
        const video = screen.getByTestId("media-video")
        expect(video).toBeInTheDocument()
        expect(video).toHaveAttribute("src", videoUrl)
        expect(video).toHaveAttribute("aria-label", "Test Video")
    })

    it("renders a video based on URL extension", () => {
        render(<MediaPlayer url={videoUrl} alt="Test Video" />)
        const video = screen.getByTestId("media-video")
        expect(video).toBeInTheDocument()
        expect(video).toHaveAttribute("src", videoUrl)
    })

    it("shows loading spinner initially", () => {
        render(<MediaPlayer url={imageUrl} alt="Test Image" />)
        const img = screen.getByTestId("media-image")
        expect(img.parentElement?.querySelector(".animate-spin")).toBeInTheDocument()
    })

    it("calls onLoad when video loads", () => {
        const handleLoad = vi.fn()
        render(<MediaPlayer url={videoUrl} contentType="video/mp4" onLoad={handleLoad} />)
        const video = screen.getByTestId("media-video")
        fireEvent(video, new Event("loadeddata"))
        expect(handleLoad).toHaveBeenCalled()
    })

    it("calls onLoad when image loads", () => {
        const handleLoad = vi.fn()
        render(<MediaPlayer url={imageUrl} onLoad={handleLoad} />)
        const img = screen.getByTestId("media-image")
        fireEvent.load(img)
        expect(handleLoad).toHaveBeenCalled()
    })

    it("calls onError when image fails to load", () => {
        const handleError = vi.fn()
        render(<MediaPlayer url={imageUrl} onError={handleError} />)
        const img = screen.getByTestId("media-image")
        fireEvent.error(img)
        expect(screen.getByText("Failed to load media")).toBeInTheDocument()
        expect(handleError).toHaveBeenCalled()
    })

    it("handles video click to play/pause when controls are disabled", async () => {
        render(<MediaPlayer url={videoUrl} controls={false} />)
        const video = screen.getByTestId("media-video") as HTMLVideoElement

        // Mock play/pause since they aren't implemented in JSDOM
        // play() returns a Promise in the real implementation
        video.play = vi.fn().mockResolvedValue(undefined)
        video.pause = vi.fn()

        // Mock paused state
        Object.defineProperty(video, "paused", {
            get: () => video.dataset.paused === "true",
            configurable: true
        })
        video.dataset.paused = "true"

        // Click to play - the handler is async
        fireEvent.click(video)
        await waitFor(() => {
            expect(video.play).toHaveBeenCalled()
        })

        // Simulate that video is now playing
        video.dataset.paused = "false"
        
        // Click to pause - the handler waits for any pending play() before calling pause()
        fireEvent.click(video)
        await waitFor(() => {
            expect(video.pause).toHaveBeenCalled()
        })
    })

    it("passes custom className to the container", () => {
        const { container } = render(<MediaPlayer url={imageUrl} className="custom-class" />)
        expect(container.firstChild).toHaveClass("custom-class")
    })
})
