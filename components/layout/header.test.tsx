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
import { usePollenAuth } from "@/lib/pollen-auth"

// Mock usePollenAuth
vi.mock("@/lib/pollen-auth", () => ({
    usePollenAuth: vi.fn(),
}))

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

vi.mock("@/components/pollen-balance", () => ({
    PollenBalanceDisplay: () => <div data-testid="pollen-balance-display" />,
}))

vi.mock("@/components/studio/upgrade-modal", () => ({
    UpgradeModal: () => <div data-testid="upgrade-modal" />,
}))

vi.mock("@/components/studio/api-key-onboarding-modal", () => ({
    ApiKeyOnboardingModal: () => <div data-testid="api-key-modal" />,
}))

// Mock utils
vi.mock("@/lib/utils", () => ({
    cn: (...inputs: Array<string | undefined | null | false>) => inputs.filter((x): x is string => !!x).join(" "),
    isLocalhost: vi.fn(() => false),
}))

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default mock states
        vi.mocked(useUser).mockReturnValue({
            isSignedIn: true,
            isLoaded: true,
            user: { id: "user_1" },
        } as unknown as ReturnType<typeof useUser>)
        vi.mocked(usePathname).mockReturnValue("/studio")
        vi.mocked(useTheme).mockReturnValue({
            theme: "dark",
            setTheme: vi.fn(),
            themes: ["light", "dark"],
            resolvedTheme: "dark",
            systemTheme: "dark",
            forcedTheme: undefined,
        } as unknown as ReturnType<typeof useTheme>)
        vi.mocked(useQuery).mockReturnValue({ status: "pro" })
        vi.mocked(usePollenAuth).mockReturnValue({
            apiKey: "test_api_key",
            isLoading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        } as unknown as ReturnType<typeof usePollenAuth>)
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
            user: null,
        } as unknown as ReturnType<typeof useUser>)

        render(<Header />)
        expect(screen.getByText("Sign In")).toBeInTheDocument()
    })

    it("does not render settings cogwheel when not signed in", () => {
        vi.mocked(useUser).mockReturnValue({
            isSignedIn: false,
            isLoaded: true,
            user: null,
        } as unknown as ReturnType<typeof useUser>)

        render(<Header />)
        expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument()
    })

    it("renders settings cogwheel when signed in", () => {
        render(<Header />)
        expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument()
    })

    it("shows mobile menu when toggle is clicked", () => {
        render(<Header />)
        const toggle = screen.getByRole("button", { name: /toggle|menu/i })

        fireEvent.click(toggle)

        const studioLinks = screen.getAllByText("Studio")
        expect(studioLinks.length).toBeGreaterThan(1)
    })

    describe("Pollen Balance Display Integration", () => {
        it("renders pollen balance display when signed in", () => {
            render(<Header />)
            expect(screen.getByTestId("pollen-balance-display")).toBeInTheDocument()
        })

        it("does not render pollen balance display when not signed in", () => {
            vi.mocked(useUser).mockReturnValue({
                isSignedIn: false,
                isLoaded: true,
                user: null,
            } as unknown as ReturnType<typeof useUser>)

            render(<Header />)
            expect(screen.queryByTestId("pollen-balance-display")).not.toBeInTheDocument()
        })

        it("positions pollen balance display near subscription badge", () => {
            render(<Header />)
            const subscriptionBadge = screen.getByTestId("subscription-badge")
            const pollenBalance = screen.getByTestId("pollen-balance-display")
            
            expect(subscriptionBadge).toBeInTheDocument()
            expect(pollenBalance).toBeInTheDocument()
            
            expect(subscriptionBadge.parentElement?.parentElement).toBe(
                pollenBalance.parentElement?.parentElement
            )
        })
    })
})
