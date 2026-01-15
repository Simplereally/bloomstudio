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

// Mock server actions to avoid server-only import error
vi.mock("server-only", () => { return {} })
vi.mock("@/app/_server/actions/invalidation", () => ({
    invalidateUserFavoritesCache: vi.fn(),
    invalidateUserHistoryCache: vi.fn(),
    invalidatePublicFeedCache: vi.fn(),
    invalidateVisibilityChange: vi.fn(),
    invalidateImageDeletion: vi.fn(),
    invalidateFollowChange: vi.fn(),
    invalidateUserFollowingFeedCache: vi.fn(),
}))

// Mock use-favorites hook to avoid TanStack Query dependency
vi.mock("@/hooks/queries/use-favorites", () => ({
    useToggleFavorite: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
    })),
}))

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

        it("renders a video element with autoPlay for video content", () => {
            const { container } = render(<ImageCard {...defaultProps} image={videoImage} />)

            const video = container.querySelector("video") as HTMLVideoElement
            expect(video).toBeInTheDocument()
            expect(video).toHaveAttribute("src", videoImage.url)
            // Videos should auto-play and loop
            expect(video).toHaveAttribute("autoplay")
            expect(video).toHaveAttribute("loop")
            // muted is a boolean property, not an attribute in the DOM
            expect(video.muted).toBe(true)
        })
    })

    describe("Unauthenticated User", () => {
        beforeEach(() => {
            vi.mocked(useUser).mockReturnValue({ isSignedIn: false, user: null } as any)
        })

        it("renders sign-in link for copy button", () => {
            render(<ImageCard {...defaultProps} />)
            // There are two links to sign-in: one for favorite, one for copy.
            // We can find them by href.
            const links = screen.getAllByRole("link", { hidden: true })
            const signInLinks = links.filter(link => link.getAttribute("href") === "/sign-in")

            // Should be at least 2 (Copy and Favorite)
            expect(signInLinks.length).toBeGreaterThanOrEqual(2)
        })

        it("renders sign-in link for favorite button", () => {
            render(<ImageCard {...defaultProps} />)
            const links = screen.getAllByRole("link", { hidden: true })
            const signInLinks = links.filter(link => link.getAttribute("href") === "/sign-in")

            // Should be at least 2 (Copy and Favorite)
            expect(signInLinks.length).toBeGreaterThanOrEqual(2)
        })
    })
})