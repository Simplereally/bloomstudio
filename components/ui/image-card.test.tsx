/**
 * @vitest-environment jsdom
 * 
 * Tests for ImageCard Component
 */
import { useUser } from "@clerk/nextjs"
import { fireEvent, render, screen } from "@testing-library/react"
import { useQuery } from "convex/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ImageCard, type ImageCardData } from "./image-card"

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
    useUser: vi.fn(),
}))

// Mock Convex
vi.mock("convex/react", () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()), // Return a function for toggleFavorite
}))

// Mock models config
vi.mock("@/lib/config/models", () => ({
    getModelDisplayName: vi.fn((m) => m),
}))

// Mock image-models
vi.mock("@/lib/image-models", () => ({
    getClampedAspectRatio: vi.fn(() => 1),
}))

describe("ImageCard", () => {
    const mockImage: ImageCardData = {
        _id: "img1",
        url: "/test-image.jpg",
        prompt: "A test prompt",
        model: "test-model",
        width: 1024,
        height: 1024,
    }

    const defaultProps = {
        image: mockImage,
        onSelect: vi.fn(),
        selectionMode: false,
        isSelected: false,
        onSelectionChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useUser).mockReturnValue({ isSignedIn: true, user: { id: "user1" } } as any)
        vi.mocked(useQuery).mockReturnValue(false) // Not favorited
    })

    it("renders image and prompt (alt text)", () => {
        render(<ImageCard {...defaultProps} />)
        const img = screen.getByRole("img")
        expect(img).toHaveAttribute("alt", "A test prompt")
    })

    it("calls onSelect when clicked in normal mode", () => {
        render(<ImageCard {...defaultProps} />)
        fireEvent.click(screen.getByRole("img").parentElement!)
        expect(defaultProps.onSelect).toHaveBeenCalledWith(mockImage)
    })

    describe("Selection Mode", () => {
        it("renders checkbox when selectionMode is true", () => {
            const { container } = render(<ImageCard {...defaultProps} selectionMode={true} />)
            const checkbox = container.querySelector("button[role='checkbox']")
            expect(checkbox).toBeInTheDocument()
        })

        it("reflects isSelected prop in checkbox state", () => {
            const { container } = render(<ImageCard {...defaultProps} selectionMode={true} isSelected={true} />)
            const checkbox = container.querySelector("button[role='checkbox']")
            expect(checkbox).toHaveAttribute("aria-checked", "true")
        })

        it("calls onSelectionChange when clicking the card in selection mode", () => {
            render(<ImageCard {...defaultProps} selectionMode={true} />)
            fireEvent.click(screen.getByRole("img").parentElement!)
            expect(defaultProps.onSelectionChange).toHaveBeenCalledWith("img1", true)
            expect(defaultProps.onSelect).not.toHaveBeenCalled()
        })

        it("calls onSelectionChange when clicking the checkbox", () => {
            const { container } = render(<ImageCard {...defaultProps} selectionMode={true} />)
            const checkbox = container.querySelector("button[role='checkbox']")!
            fireEvent.click(checkbox)
            expect(defaultProps.onSelectionChange).toHaveBeenCalledWith("img1", true)
        })

        it("applies ring styling when selected", () => {
            const { container } = render(<ImageCard {...defaultProps} selectionMode={true} isSelected={true} />)
            const card = container.firstChild as HTMLElement
            expect(card.className).toContain("ring-primary")
        })

        it("does NOT apply ring styling when NOT selected", () => {
            const { container } = render(<ImageCard {...defaultProps} selectionMode={true} isSelected={false} />)
            const card = container.firstChild as HTMLElement
            expect(card.className).not.toContain("ring-primary")
        })
    })

    describe("Video Support", () => {
        const videoImage: ImageCardData = {
            ...mockImage,
            url: "/test-video.mp4",
            contentType: "video/mp4",
        }

        it("renders a video element for video content", () => {
            const { container } = render(<ImageCard {...defaultProps} image={videoImage} />)

            const video = container.querySelector("video")
            expect(video).toBeInTheDocument()
            expect(video).toHaveAttribute("src", videoImage.url)
            // Check for play icon
            const playIcon = container.querySelector("svg.lucide-play")
            expect(playIcon).toBeInTheDocument()
        })
    })
})
