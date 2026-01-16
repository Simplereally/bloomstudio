/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SensitiveContentOverlay } from "./sensitive-content-overlay"
import { toast } from "sonner"

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: vi.fn()
}))

// Mock useRouter
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush
    })
}))

describe("SensitiveContentOverlay", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders sensitive content warning", () => {
        render(<SensitiveContentOverlay />)
        expect(screen.getByText("Sensitive Content")).toBeInTheDocument()
    })

    describe("Authenticated User (Allowed to Reveal)", () => {
        it("reveals content when clicked", () => {
            const onReveal = vi.fn()
            render(<SensitiveContentOverlay onReveal={onReveal} isAllowedToReveal={true} />)
            
            const overlay = screen.getByText("Sensitive Content").closest("div")?.parentElement
            fireEvent.click(overlay!)
            
            expect(onReveal).toHaveBeenCalled()
        })

        it("shows 'Click to reveal' text", () => {
            render(<SensitiveContentOverlay isAllowedToReveal={true} />)
            expect(screen.getByText("Click to reveal")).toBeInTheDocument()
        })
    })

    describe("Unauthenticated User (Locked)", () => {
        it("triggers toast and does NOT reveal when clicked", () => {
            const onReveal = vi.fn()
            render(<SensitiveContentOverlay onReveal={onReveal} isAllowedToReveal={false} />)
            
            const overlay = screen.getByText("Sign in to view").closest("div")?.parentElement
            fireEvent.click(overlay!)
            
            expect(onReveal).not.toHaveBeenCalled()
            expect(toast).toHaveBeenCalledWith(
                "Please sign in to view sensitive content",
                expect.objectContaining({
                    action: expect.objectContaining({
                        label: "Sign In"
                    })
                })
            )
        })

        it("shows 'Sign in to view' text", () => {
            render(<SensitiveContentOverlay isAllowedToReveal={false} />)
            expect(screen.getByText("Sign in to view")).toBeInTheDocument()
        })

        it("redirects to sign-in when toast action is clicked", () => {
             // We need to simulate the toast action click. 
             // Since we mocked toast to just be a fn, we can capture the args and call onClick.
             render(<SensitiveContentOverlay isAllowedToReveal={false} />)
             const overlay = screen.getByText("Sign in to view").closest("div")?.parentElement
             fireEvent.click(overlay!)

             const toastCall = vi.mocked(toast).mock.calls[0] as [string, object | undefined]
             const options = toastCall?.[1]
             if (!options || typeof options !== "object") {
                 throw new Error("Expected toast options object")
             }
             if (!("action" in options)) {
                 throw new Error("Expected toast options to include action")
             }
             const action = (options as { action?: unknown }).action
             if (!action || typeof action !== "object") {
                 throw new Error("Expected toast action object")
             }
             if (!("onClick" in action)) {
                 throw new Error("Expected toast action to include onClick")
             }
             const onClick = (action as { onClick?: unknown }).onClick
             if (typeof onClick !== "function") {
                 throw new Error("Expected toast action onClick function")
             }

             onClick()
             expect(mockPush).toHaveBeenCalledWith("/sign-in")
        })
    })
})
