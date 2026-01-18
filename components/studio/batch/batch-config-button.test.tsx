/**
 * @vitest-environment jsdom
 *
 * Tests for BatchConfigButton Component
 * 
 * Key behaviors tested:
 * - Component renders correctly
 * - Settings callbacks work
 * - Mobile drawer compatibility: popover has correct event handlers
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BatchConfigButton } from "./batch-config-button"

// Create spies for the event prevention handlers


// Mock Radix Popover to capture the event handler props
let capturedPopoverContentProps: Record<string, unknown> = {}

vi.mock("@/components/ui/popover", () => ({
    Popover: ({ children, modal }: { children: React.ReactNode; modal?: boolean }) => (
        <div data-testid="popover-root" data-modal={String(modal ?? true)}>
            {children}
        </div>
    ),
    PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-trigger">{children}</div>
    ),
    PopoverContent: ({ 
        children, 
        className,
        onPointerDownOutside,
        onFocusOutside,
        onInteractOutside,
        ...props
    }: { 
        children: React.ReactNode
        className?: string
        onPointerDownOutside?: (e: { preventDefault: () => void }) => void
        onFocusOutside?: (e: { preventDefault: () => void }) => void
        onInteractOutside?: (e: { preventDefault: () => void }) => void
    }) => {
        // Capture props for testing
        capturedPopoverContentProps = {
            onPointerDownOutside,
            onFocusOutside,
            onInteractOutside,
            ...props,
        }
        return (
            <div 
                data-testid="popover-content" 
                className={className}
                data-has-pointer-handler={String(!!onPointerDownOutside)}
                data-has-focus-handler={String(!!onFocusOutside)}
                data-has-interact-handler={String(!!onInteractOutside)}
                data-vaul-no-drag={props["data-vaul-no-drag"] ? "true" : undefined}
            >
                {children}
            </div>
        )
    },
}))

vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: () => null,
}))

vi.mock("@/components/ui/button", () => ({
    Button: ({ 
        children, 
        onClick, 
        disabled,
        className 
    }: { 
        children: React.ReactNode
        onClick?: () => void
        disabled?: boolean
        className?: string
    }) => (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={className}
            data-testid="batch-config-trigger"
        >
            {children}
        </button>
    ),
}))

vi.mock("@/components/ui/switch", () => ({
    Switch: ({ 
        checked, 
        onCheckedChange, 
        id,
    }: { 
        checked: boolean
        onCheckedChange: (checked: boolean) => void
        id?: string
    }) => (
        <button
            role="switch"
            aria-checked={checked}
            data-testid="batch-toggle-switch"
            id={id}
            onClick={() => onCheckedChange(!checked)}
        >
            {checked ? "On" : "Off"}
        </button>
    ),
}))

vi.mock("@/components/ui/input", () => ({
    Input: ({ 
        value, 
        onChange,
        id,
        type,
        disabled,
    }: { 
        value: number
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
        id?: string
        type?: string
        disabled?: boolean
    }) => (
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            data-testid="batch-count-input"
        />
    ),
}))

vi.mock("@/components/ui/label", () => ({
    Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
        <label htmlFor={htmlFor}>{children}</label>
    ),
}))

describe("BatchConfigButton", () => {
    const defaultProps = {
        settings: { enabled: false, count: 10 },
        onSettingsChange: vi.fn(),
        disabled: false,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        capturedPopoverContentProps = {}
    })

    describe("Basic Rendering", () => {
        it("renders the trigger button", () => {
            render(<BatchConfigButton {...defaultProps} />)
            expect(screen.getByTestId("batch-config-trigger")).toBeInTheDocument()
        })

        it("renders the popover content with switch", () => {
            render(<BatchConfigButton {...defaultProps} />)
            expect(screen.getByTestId("popover-content")).toBeInTheDocument()
            expect(screen.getByTestId("batch-toggle-switch")).toBeInTheDocument()
        })
    })

    /**
     * CRITICAL: Mobile Drawer Compatibility
     * 
     * When BatchConfigButton is rendered inside a Vaul drawer (mobile editor),
     * the popover must NOT close when the user interacts with elements inside.
     * 
     * The issue: Vaul drawer's overlay causes Radix Popover to incorrectly detect
     * clicks on the Switch as "outside" clicks, closing the popover.
     * 
     * The fix: Add event handlers that prevent the popover from closing:
     * - onPointerDownOutside: prevent closing on pointer events
     * - onFocusOutside: prevent closing on focus changes  
     * - onInteractOutside: prevent closing on any interaction
     * - data-vaul-no-drag: prevent Vaul from intercepting as drag gesture
     */
    describe("Mobile Drawer Compatibility", () => {
        it("has modal={false} on Popover", () => {
            render(<BatchConfigButton {...defaultProps} />)
            
            const popoverRoot = screen.getByTestId("popover-root")
            expect(popoverRoot).toHaveAttribute("data-modal", "false")
        })

        it("has data-vaul-no-drag attribute on PopoverContent", () => {
            render(<BatchConfigButton {...defaultProps} />)
            
            const popoverContent = screen.getByTestId("popover-content")
            expect(popoverContent).toHaveAttribute("data-vaul-no-drag", "true")
        })

        it("has onPointerDownOutside handler that prevents default", () => {
            render(<BatchConfigButton {...defaultProps} />)
            
            expect(screen.getByTestId("popover-content")).toHaveAttribute(
                "data-has-pointer-handler",
                "true"
            )

            // Verify the handler calls preventDefault
            const handler = capturedPopoverContentProps.onPointerDownOutside as (
                e: { preventDefault: () => void }
            ) => void
            expect(handler).toBeDefined()
            
            const mockEvent = { preventDefault: vi.fn() }
            handler(mockEvent)
            expect(mockEvent.preventDefault).toHaveBeenCalled()
        })

        it("has onFocusOutside handler that prevents default", () => {
            render(<BatchConfigButton {...defaultProps} />)
            
            expect(screen.getByTestId("popover-content")).toHaveAttribute(
                "data-has-focus-handler",
                "true"
            )

            // Verify the handler calls preventDefault
            const handler = capturedPopoverContentProps.onFocusOutside as (
                e: { preventDefault: () => void }
            ) => void
            expect(handler).toBeDefined()
            
            const mockEvent = { preventDefault: vi.fn() }
            handler(mockEvent)
            expect(mockEvent.preventDefault).toHaveBeenCalled()
        })

        it("has onInteractOutside handler that prevents default", () => {
            render(<BatchConfigButton {...defaultProps} />)
            
            expect(screen.getByTestId("popover-content")).toHaveAttribute(
                "data-has-interact-handler",
                "true"
            )

            // Verify the handler calls preventDefault
            const handler = capturedPopoverContentProps.onInteractOutside as (
                e: { preventDefault: () => void }
            ) => void
            expect(handler).toBeDefined()
            
            const mockEvent = { preventDefault: vi.fn() }
            handler(mockEvent)
            expect(mockEvent.preventDefault).toHaveBeenCalled()
        })
    })

    describe("Switch Interaction", () => {
        it("calls onSettingsChange when switch is toggled to enabled", () => {
            const onSettingsChange = vi.fn()
            render(
                <BatchConfigButton 
                    {...defaultProps} 
                    settings={{ enabled: false, count: 10 }}
                    onSettingsChange={onSettingsChange}
                />
            )

            const switchElement = screen.getByTestId("batch-toggle-switch")
            fireEvent.click(switchElement)

            expect(onSettingsChange).toHaveBeenCalledWith({ enabled: true, count: 10 })
        })

        it("calls onSettingsChange when switch is toggled to disabled", () => {
            const onSettingsChange = vi.fn()
            render(
                <BatchConfigButton 
                    {...defaultProps} 
                    settings={{ enabled: true, count: 10 }}
                    onSettingsChange={onSettingsChange}
                />
            )

            const switchElement = screen.getByTestId("batch-toggle-switch")
            fireEvent.click(switchElement)

            expect(onSettingsChange).toHaveBeenCalledWith({ enabled: false, count: 10 })
        })
    })

    describe("Count Input", () => {
        it("calls onSettingsChange when count is changed", () => {
            const onSettingsChange = vi.fn()
            render(
                <BatchConfigButton 
                    {...defaultProps} 
                    settings={{ enabled: true, count: 10 }}
                    onSettingsChange={onSettingsChange}
                />
            )

            const input = screen.getByTestId("batch-count-input")
            fireEvent.change(input, { target: { value: "25" } })

            expect(onSettingsChange).toHaveBeenCalledWith({ enabled: true, count: 25 })
        })

        it("clamps count to maximum of 1000", () => {
            const onSettingsChange = vi.fn()
            render(
                <BatchConfigButton 
                    {...defaultProps} 
                    settings={{ enabled: true, count: 10 }}
                    onSettingsChange={onSettingsChange}
                />
            )

            const input = screen.getByTestId("batch-count-input")
            fireEvent.change(input, { target: { value: "5000" } })

            expect(onSettingsChange).toHaveBeenCalledWith({ enabled: true, count: 1000 })
        })

        it("clamps count to minimum of 1", () => {
            const onSettingsChange = vi.fn()
            render(
                <BatchConfigButton 
                    {...defaultProps} 
                    settings={{ enabled: true, count: 10 }}
                    onSettingsChange={onSettingsChange}
                />
            )

            const input = screen.getByTestId("batch-count-input")
            fireEvent.change(input, { target: { value: "0" } })

            expect(onSettingsChange).toHaveBeenCalledWith({ enabled: true, count: 1 })
        })
    })

    describe("Disabled State", () => {
        it("disables the trigger button when disabled prop is true", () => {
            render(<BatchConfigButton {...defaultProps} disabled={true} />)
            
            expect(screen.getByTestId("batch-config-trigger")).toBeDisabled()
        })
    })
})
