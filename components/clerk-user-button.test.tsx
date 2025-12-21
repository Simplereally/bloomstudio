import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ClerkUserButton } from "./clerk-user-button"

// Mock Clerk's UserButton
vi.mock("@clerk/nextjs", () => ({
    UserButton: vi.fn(({ afterSignOutUrl }: { afterSignOutUrl: string }) => (
        <div data-testid="clerk-user-button" data-after-sign-out-url={afterSignOutUrl}>
            User Button
        </div>
    )),
}))

describe("ClerkUserButton", () => {
    it("renders the UserButton after mounting", () => {
        render(<ClerkUserButton />)

        // After mount, we should see the UserButton
        const userButton = screen.getByTestId("clerk-user-button")
        expect(userButton).toBeInTheDocument()
        expect(userButton).toHaveAttribute("data-after-sign-out-url", "/")
    })

    it("passes custom afterSignOutUrl to UserButton", () => {
        const customUrl = "/signed-out"
        render(<ClerkUserButton afterSignOutUrl={customUrl} />)

        const userButton = screen.getByTestId("clerk-user-button")
        expect(userButton).toHaveAttribute("data-after-sign-out-url", customUrl)
    })
})
