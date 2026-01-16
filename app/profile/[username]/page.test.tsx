/**
 * @vitest-environment jsdom
 *
 * Tests for Profile Page - specifically the FollowButton component
 */
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the server action
const mockInvalidateFollowChange = vi.fn()
vi.mock("@/app/_server/actions/invalidation", () => ({
    invalidateFollowChange: () => mockInvalidateFollowChange(),
}))

// Mock Convex hooks
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockFollow = vi.fn()
const mockUnfollow = vi.fn()

vi.mock("convex/react", () => ({
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (mutationRef: unknown) => {
        // Return the appropriate mock based on which mutation is requested
        if (mutationRef === "follow") return mockFollow
        if (mutationRef === "unfollow") return mockUnfollow
        return mockUseMutation(mutationRef)
    },
}))

// Mock the API references
vi.mock("@/convex/_generated/api", () => ({
    api: {
        users: {
            getCurrentUser: "getCurrentUser",
            getUserProfile: "getUserProfile",
            getSensitiveContentPreference: "getSensitiveContentPreference",
        },
        follows: {
            isFollowing: "isFollowing",
            follow: "follow",
            unfollow: "unfollow",
        },
        generatedImages: {
            getImagesByUsername: "getImagesByUsername",
        },
    },
}))

// Mock useProfileImages hook
vi.mock("@/hooks/queries/use-image-history", () => ({
    useProfileImages: () => ({
        results: [],
        status: "Exhausted",
        loadMore: vi.fn(),
    }),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useParams: () => ({ username: "testuser" }),
}))

// Mock next/link
vi.mock("next/link", () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

// Mock Button component to avoid asChild issues
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean;[key: string]: unknown }) => {
        if (asChild) {
            // When asChild is true, just render children directly
            return <>{children}</>
        }
        return <button {...props}>{children}</button>
    },
}))

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

// Mock PaginatedImageGrid
vi.mock("@/components/gallery/paginated-image-grid", () => ({
    PaginatedImageGrid: ({ userShowsSensitive }: { userShowsSensitive?: boolean }) => (
        <div data-testid="image-grid" data-user-shows-sensitive={userShowsSensitive?.toString()}>Image Grid</div>
    ),
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    Loader2: () => <span data-testid="loader">Loading...</span>,
    Plus: () => <span data-testid="plus-icon">+</span>,
    UserCheck: () => <span data-testid="check-icon">✓</span>,
    LogIn: () => <span data-testid="login-icon">→</span>,
}))

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

// Import after mocks
import ProfilePage from "./page"
import { toast } from "sonner"

describe("ProfilePage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFollow.mockResolvedValue(undefined)
        mockUnfollow.mockResolvedValue(undefined)
        mockInvalidateFollowChange.mockResolvedValue(undefined)
    })

    describe("FollowButton", () => {
        const mockUserProfile = {
            clerkId: "user_456",
            username: "testuser",
            pictureUrl: "https://example.com/avatar.jpg",
            imagesCount: 10,
            followersCount: 100,
            followingCount: 50,
        }

        const mockCurrentUser = {
            clerkId: "user_123",
        }

        it("renders Follow button when not following", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            expect(screen.getByText("Follow")).toBeInTheDocument()
        })

        it("renders Following button when already following", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return true
                return undefined
            })

            render(<ProfilePage />)

            expect(screen.getByText("Following")).toBeInTheDocument()
        })

        it("does not render follow button for own profile", () => {
            const selfProfile = { ...mockUserProfile, clerkId: "user_123" }
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return selfProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            expect(screen.queryByText("Follow")).not.toBeInTheDocument()
            expect(screen.queryByText("Following")).not.toBeInTheDocument()
        })

        it("calls follow mutation and invalidates cache when clicking Follow", async () => {
            const user = userEvent.setup()
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            await user.click(screen.getByText("Follow"))

            await waitFor(() => {
                expect(mockFollow).toHaveBeenCalledWith({ followeeId: "user_456" })
            })

            await waitFor(() => {
                expect(mockInvalidateFollowChange).toHaveBeenCalled()
            })

            expect(toast.success).toHaveBeenCalledWith("Followed")
        })

        it("calls unfollow mutation and invalidates cache when clicking Following", async () => {
            const user = userEvent.setup()
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return true
                return undefined
            })

            render(<ProfilePage />)

            await user.click(screen.getByText("Following"))

            await waitFor(() => {
                expect(mockUnfollow).toHaveBeenCalledWith({ followeeId: "user_456" })
            })

            await waitFor(() => {
                expect(mockInvalidateFollowChange).toHaveBeenCalled()
            })

            expect(toast.success).toHaveBeenCalledWith("Unfollowed")
        })

        it("shows error toast when follow fails", async () => {
            const user = userEvent.setup()
            mockFollow.mockRejectedValue(new Error("Network error"))
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            await user.click(screen.getByText("Follow"))

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Failed to update follow status")
            })

            // Cache should NOT be invalidated on error
            expect(mockInvalidateFollowChange).not.toHaveBeenCalled()
        })

        it("shows loading state while follow action is in progress", async () => {
            const user = userEvent.setup()
            // Make follow take some time
            mockFollow.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            await user.click(screen.getByText("Follow"))

            // Should show loading state
            expect(screen.getByTestId("loader")).toBeInTheDocument()
        })

        it("disables button while loading", async () => {
            const user = userEvent.setup()
            mockFollow.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return mockCurrentUser
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            const button = screen.getByRole("button")
            await user.click(button)

            expect(button).toBeDisabled()
        })

        it("renders sign-in link when unauthenticated", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return null
                if (queryRef === "isFollowing") return false
                return undefined
            })

            render(<ProfilePage />)

            const link = screen.getByRole("link", { name: /Follow/i })
            expect(link).toBeInTheDocument()
            expect(link).toHaveAttribute("href", "/sign-in")
        })
    })

    describe("Profile states", () => {
        it("shows skeleton while loading", () => {
            mockUseQuery.mockReturnValue(undefined)

            render(<ProfilePage />)

            // Should show skeleton (multiple skeleton elements)
            expect(document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]').length).toBeGreaterThan(0)
        })

        it("shows not found when user does not exist", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return null
                return undefined
            })

            render(<ProfilePage />)

            expect(screen.getByText("User not found")).toBeInTheDocument()
        })
    })

    describe("Sensitive content handling", () => {
        const mockUserProfile = {
            clerkId: "user_456",
            username: "testuser",
            pictureUrl: "https://example.com/avatar.jpg",
            imagesCount: 10,
            followersCount: 100,
            followingCount: 50,
        }

        it("passes userShowsSensitive=false to grid when preference is blur", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return null
                if (queryRef === "isFollowing") return false
                if (queryRef === "getSensitiveContentPreference") return "blur"
                return undefined
            })

            render(<ProfilePage />)

            const grid = screen.getByTestId("image-grid")
            expect(grid).toHaveAttribute("data-user-shows-sensitive", "false")
        })

        it("passes userShowsSensitive=false to grid when preference is block", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return null
                if (queryRef === "isFollowing") return false
                if (queryRef === "getSensitiveContentPreference") return "block"
                return undefined
            })

            render(<ProfilePage />)

            const grid = screen.getByTestId("image-grid")
            expect(grid).toHaveAttribute("data-user-shows-sensitive", "false")
        })

        it("passes userShowsSensitive=true to grid when preference is allow", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return null
                if (queryRef === "isFollowing") return false
                if (queryRef === "getSensitiveContentPreference") return "allow"
                return undefined
            })

            render(<ProfilePage />)

            const grid = screen.getByTestId("image-grid")
            expect(grid).toHaveAttribute("data-user-shows-sensitive", "true")
        })

        it("defaults to userShowsSensitive=false when preference is undefined (unauthenticated)", () => {
            mockUseQuery.mockImplementation((queryRef: string) => {
                if (queryRef === "getUserProfile") return mockUserProfile
                if (queryRef === "getCurrentUser") return null
                if (queryRef === "isFollowing") return false
                if (queryRef === "getSensitiveContentPreference") return undefined
                return undefined
            })

            render(<ProfilePage />)

            const grid = screen.getByTestId("image-grid")
            // undefined !== "allow", so userShowsSensitive should be false
            expect(grid).toHaveAttribute("data-user-shows-sensitive", "false")
        })
    })
})
