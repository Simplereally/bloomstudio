// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FeedTabs } from "./feed-tabs"

// Mock Clerk auth - parametrizable for different test scenarios  
const mockUseAuth = vi.fn()
vi.mock("@clerk/nextjs", () => ({
    useAuth: () => mockUseAuth(),
}))

// Mock next/link
vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

describe("FeedTabs", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("authenticated user", () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isSignedIn: true })
        })

        it("renders both Public and Following tabs", () => {
            render(<FeedTabs activeType="public" />)

            expect(screen.getByText("Public")).toBeInTheDocument()
            expect(screen.getByText("Following")).toBeInTheDocument()
        })

        it("highlights the active tab", () => {
            render(<FeedTabs activeType="following" />)

            const followingLink = screen.getByText("Following").closest("a")
            expect(followingLink).toHaveClass("bg-background")
        })

        it("links to the correct feed routes", () => {
            render(<FeedTabs activeType="public" />)

            expect(screen.getByText("Public").closest("a")).toHaveAttribute("href", "/feed/public")
            expect(screen.getByText("Following").closest("a")).toHaveAttribute("href", "/feed/following")
        })
    })

    describe("unauthenticated user", () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isSignedIn: false })
        })

        it("returns null (no tabs) when user is not signed in", () => {
            const { container } = render(<FeedTabs activeType="public" />)

            // Should not render any tabs since only one tab visible
            expect(container.firstChild).toBeNull()
        })

        it("does not show Following tab", () => {
            render(<FeedTabs activeType="public" />)

            expect(screen.queryByText("Following")).not.toBeInTheDocument()
        })
    })
})
