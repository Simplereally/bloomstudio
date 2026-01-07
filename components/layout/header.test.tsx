/**
 * @vitest-environment jsdom
 * 
 * Tests for the main application Header component.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Header } from "./header"
import { useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useQuery } from "convex/react"

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
    useUser: vi.fn(),
    UserButton: () => <div data-testid="user-button" />,
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(),
}))

// Mock next-themes
vi.mock("next-themes", () => ({
    useTheme: vi.fn(),
}))

// Mock components that are gated or have their own tests
vi.mock("@/components/subscription/subscription-badge", () => ({
    SubscriptionBadge: () => <div data-testid="subscription-badge" />,
}))

vi.mock("@/components/studio/upgrade-modal", () => ({
    UpgradeModal: () => <div data-testid="upgrade-modal" />,
}))

vi.mock("@/components/studio/api-key-onboarding-modal", () => ({
    ApiKeyOnboardingModal: () => <div data-testid="api-key-modal" />,
}))

// Mock utils
vi.mock("@/lib/utils", () => ({
    cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
    isLocalhost: vi.fn(() => false),
}))

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default mock states
        vi.mocked(useUser).mockReturnValue({
            isSignedIn: true,
            isLoaded: true,
            user: { id: "user_1" } as any,
        } as any)
        vi.mocked(usePathname).mockReturnValue("/studio")
        vi.mocked(useTheme).mockReturnValue({
            theme: "dark",
            setTheme: vi.fn(),
        } as any)
        vi.mocked(useQuery).mockReturnValue({ status: "pro" })
    })

    it("renders the brand logo and name", () => {
        render(<Header />)
        expect(screen.getByText("Bloom Studio")).toBeInTheDocument()
    })

    it("renders navigation items when signed in", () => {
        render(<Header />)
        expect(screen.getByText("Studio")).toBeInTheDocument()
        expect(screen.getByText("Feed")).toBeInTheDocument()
        expect(screen.getByText("History")).toBeInTheDocument()
        expect(screen.getByText("Favorites")).toBeInTheDocument()
    })

    it("renders the subscription badge when signed in", () => {
        render(<Header />)
        expect(screen.getByTestId("subscription-badge")).toBeInTheDocument()
    })

    it("renders the user button when signed in", () => {
        render(<Header />)
        expect(screen.getByTestId("user-button")).toBeInTheDocument()
    })

    it("does not render on landing/auth pages", () => {
        vi.mocked(usePathname).mockReturnValue("/")
        const { container } = render(<Header />)
        expect(container.firstChild).toBeNull()

        vi.mocked(usePathname).mockReturnValue("/sign-in")
        const { container: container2 } = render(<Header />)
        expect(container2.firstChild).toBeNull()
    })

    it("renders sign in button when not signed in", () => {
        vi.mocked(useUser).mockReturnValue({
            isSignedIn: false,
            isLoaded: true,
        } as any)

        render(<Header />)
        expect(screen.getByText("Sign In")).toBeInTheDocument()
    })

    it("shows mobile menu when toggle is clicked", () => {
        // Force mobile view logic by mocking screen size if necessary, 
        // but here the toggle is just hidden by CSS, so it should be in the DOM.
        render(<Header />)
        const toggle = screen.getByRole("button", { name: /toggle|menu/i })

        fireEvent.click(toggle)

        // After clicking, mobile nav items should be visible (or at least rendered)
        // Note: we can check for multiple instances if they share labels
        const studioLinks = screen.getAllByText("Studio")
        expect(studioLinks.length).toBeGreaterThan(1)
    })
})
