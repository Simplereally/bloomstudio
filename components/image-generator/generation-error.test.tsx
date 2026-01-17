/**
 * @vitest-environment jsdom
 * 
 * Tests for GenerationError Component
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { GenerationError, InlineError } from "./generation-error"
import { PollinationsApiError, ApiErrorCodeConst, ClientErrorCodeConst } from "@/lib/errors"

// Mock Shadcn UI components to avoid testing them and focus on GenerationError logic
vi.mock("@/components/ui/alert", () => ({
    Alert: ({ children, variant, className }: { children?: React.ReactNode; variant?: string; className?: string }) => <div data-testid="alert" data-variant={variant} className={className}>{children}</div>,
    AlertTitle: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div data-testid="alert-title" className={className}>{children}</div>,
    AlertDescription: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div data-testid="alert-description" className={className}>{children}</div>,
}))

vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled, variant, size, className }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string; size?: string; className?: string }) => (
        <button
            data-testid="button"
            onClick={onClick}
            disabled={disabled}
            data-variant={variant}
            data-size={size}
            className={className}
        >
            {children}
        </button>
    ),
}))

vi.mock("@/components/ui/collapsible", () => ({
    Collapsible: ({ children, open, onOpenChange }: { children?: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => (
        <div data-testid="collapsible" data-open={open}>
            {children}
            {/* simulate trigger click for testing state change if needed, but since we mock, we control state usually? 
                Actually, GenerationError controls the state. 
                For the mock to work with state, we need to pass props through.
            */}
            <button data-testid="collapsible-trigger-internal" onClick={() => onOpenChange?.(!open)}>Toggle</button>
        </div>
    ),
    CollapsibleTrigger: ({ children }: { children?: React.ReactNode; asChild?: boolean }) => <div data-testid="collapsible-trigger">{children}</div>,
    CollapsibleContent: ({ children }: { children?: React.ReactNode }) => <div data-testid="collapsible-content">{children}</div>,
}))

describe("GenerationError", () => {
    it("renders nothing when no error is provided", () => {
        const { container } = render(<GenerationError error={null} />)
        expect(container).toBeEmptyDOMElement()
    })

    it("renders generic error correctly", () => {
        const error = new Error("Something went wrong")
        render(<GenerationError error={error} />)

        expect(screen.getByTestId("alert")).toBeInTheDocument()
        expect(screen.getByTestId("alert-title")).toHaveTextContent("Generation Failed")
        expect(screen.getByTestId("alert-description")).toHaveTextContent("Something went wrong")
    })

    it("renders Validation Error with correct title and message", () => {
        const error = new PollinationsApiError(
            "Validation failed",
            ClientErrorCodeConst.VALIDATION_ERROR,
            400
        )
        render(<GenerationError error={error} />)

        expect(screen.getByTestId("alert-title")).toHaveTextContent("Invalid Parameters")
        expect(screen.getByText("Invalid parameters provided")).toBeInTheDocument()
        expect(screen.getByTestId("alert")).toHaveAttribute("data-variant", "destructive")
    })

    it("renders Unauthorized Error with correct title and message", () => {
        const error = new PollinationsApiError(
            "Auth failed",
            ApiErrorCodeConst.UNAUTHORIZED,
            401
        )
        render(<GenerationError error={error} />)

        expect(screen.getByTestId("alert-title")).toHaveTextContent("Authentication Required")
        expect(screen.getByText("Authentication required")).toBeInTheDocument()
    })

    it("renders Server Error with correct title and message", () => {
        const error = new PollinationsApiError(
            "Server error",
            ApiErrorCodeConst.INTERNAL_ERROR,
            500
        )
        render(<GenerationError error={error} />)

        expect(screen.getByTestId("alert-title")).toHaveTextContent("Server Error")
        expect(screen.getByText("Server error, please retry")).toBeInTheDocument()
        expect(screen.getByTestId("alert")).toHaveAttribute("data-variant", "default")
    })

    it("displays 'Temporary error' for retryable errors", () => {
        const error = new PollinationsApiError(
            "Server error",
            ApiErrorCodeConst.INTERNAL_ERROR,
            500
        )
        render(<GenerationError error={error} />)

        expect(screen.getByText("Temporary error")).toBeInTheDocument()

        // Also check functionality of retry button presence logic if we want, 
        // though that's covered by 'isRetryable' logic
    })

    it("displays field errors when provided", () => {
        const error = new PollinationsApiError(
            "Validation Error",
            ClientErrorCodeConst.VALIDATION_ERROR,
            400,
            {
                fieldErrors: {
                    prompt: ["Required field"],
                    width: ["Must be a number"]
                }
            }
        )
        render(<GenerationError error={error} />)

        expect(screen.getByText("Please fix the following issues:")).toBeInTheDocument()
        expect(screen.getByText("prompt:")).toBeInTheDocument()
        expect(screen.getByText("Required field")).toBeInTheDocument()
        expect(screen.getByText("width:")).toBeInTheDocument()
        expect(screen.getByText("Must be a number")).toBeInTheDocument()
    })

    it("displays form errors when provided", () => {
        const error = new PollinationsApiError(
            "Validation Error",
            ClientErrorCodeConst.VALIDATION_ERROR,
            400,
            {
                formErrors: ["Generic form error 1", "Generic form error 2"]
            }
        )
        render(<GenerationError error={error} />)

        expect(screen.getByText("Generic form error 1")).toBeInTheDocument()
        expect(screen.getByText("Generic form error 2")).toBeInTheDocument()
    })

    it("displays technical details when showDetails is true and requestId is present", () => {
        const error = new PollinationsApiError(
            "Error",
            ClientErrorCodeConst.UNKNOWN_ERROR,
            500,
            { requestId: "req-123" }
        )
        render(<GenerationError error={error} showDetails={true} />)

        expect(screen.getByText("Technical Details")).toBeInTheDocument()

        // Since we mocked Collapsible to render children, we expect content to be there or hidden via CSS?
        // In our mock, we just rendered {children}.
        // The real CollapsibleContent hides it.
        // But our mock: 
        // CollapsibleContent: ({ children }: any) => <div data-testid="collapsible-content">{children}</div>
        // So it should be in the document.

        expect(screen.getByText("Request ID:")).toBeInTheDocument()
        expect(screen.getByText("req-123")).toBeInTheDocument()
    })

    it("does NOT display technical details when showDetails is false", () => {
        const error = new PollinationsApiError(
            "Error",
            ClientErrorCodeConst.UNKNOWN_ERROR,
            500,
            { requestId: "req-123" }
        )
        render(<GenerationError error={error} showDetails={false} />)

        expect(screen.queryByText("Technical Details")).not.toBeInTheDocument()
    })

    it("handles retry button", () => {
        const onRetry = vi.fn()
        const error = new Error("Error")
        render(<GenerationError error={error} onRetry={onRetry} />)

        const retryButton = screen.getByText("Try Again")
        fireEvent.click(retryButton)
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("disables retry button when isRetrying is true", () => {
        const onRetry = vi.fn()
        const error = new Error("Error")
        render(<GenerationError error={error} onRetry={onRetry} isRetrying={true} />)

        const retryButton = screen.getByText("Retrying...")
        expect(retryButton).toBeDisabled()
    })
})

describe("InlineError", () => {
    it("renders nothing when no error is provided", () => {
        const { container } = render(<InlineError error={null} />)
        expect(container).toBeEmptyDOMElement()
    })

    it("renders error message", () => {
        const error = new Error("Inline Error Message")
        render(<InlineError error={error} />)
        expect(screen.getByText("Inline Error Message")).toBeInTheDocument()
    })

    it("renders with custom class name", () => {
        const error = new Error("Error")
        const { container } = render(<InlineError error={error} className="custom-class" />)
        expect(container.firstChild).toHaveClass("custom-class")
    })
})
