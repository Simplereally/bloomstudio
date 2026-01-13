// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FeedCta } from "./feed-cta"

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

// Mock framer-motion
vi.mock("framer-motion", () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    },
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    Sparkles: () => <span data-testid="sparkles-icon">✨</span>,
    ArrowRight: () => <span data-testid="arrow-icon">→</span>,
}))

describe("FeedCta", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("authenticated user", () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true })
        })

        it("does not render for signed-in users", () => {
            const { container } = render(<FeedCta />)
            expect(container.firstChild).toBeNull()
        })
    })

    describe("loading state", () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: false })
        })

        it("does not render while auth is loading", () => {
            const { container } = render(<FeedCta />)
            expect(container.firstChild).toBeNull()
        })
    })

    describe("unauthenticated user", () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true })
        })

        it("shows CTA after 5 second delay", () => {
            render(<FeedCta />)

            // Initially not visible
            expect(screen.queryByText("Inspired by what you see?")).not.toBeInTheDocument()

            // Advance timer
            act(() => {
                vi.advanceTimersByTime(5000)
            })

            // Now visible
            expect(screen.getByText("Inspired by what you see?")).toBeInTheDocument()
        })

        it("shows CTA after scrolling 300px", () => {
            render(<FeedCta />)

            // Simulate scroll
            act(() => {
                Object.defineProperty(window, "scrollY", { value: 350, configurable: true })
                fireEvent.scroll(window)
            })

            expect(screen.getByText("Inspired by what you see?")).toBeInTheDocument()
        })

        it("has a sign-up link", () => {
            render(<FeedCta />)

            act(() => {
                vi.advanceTimersByTime(5000)
            })

            const signUpLink = screen.getByText("Start Creating").closest("a")
            expect(signUpLink).toHaveAttribute("href", "/sign-up")
        })

        it("can be dismissed", () => {
            render(<FeedCta />)

            act(() => {
                vi.advanceTimersByTime(5000)
            })

            expect(screen.getByText("Inspired by what you see?")).toBeInTheDocument()

            // Click dismiss button
            const dismissButton = screen.getByLabelText("Dismiss")
            fireEvent.click(dismissButton)

            // Should no longer be visible
            expect(screen.queryByText("Inspired by what you see?")).not.toBeInTheDocument()
        })
    })
})
