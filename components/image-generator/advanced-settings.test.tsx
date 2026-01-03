// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdvancedSettings } from "./advanced-settings"

// Mock useEnhancePrompt to avoid QueryClient requirement
vi.mock("@/hooks/queries/use-enhance-prompt", () => ({
    useEnhancePrompt: vi.fn(() => ({
        enhance: vi.fn(),
        cancel: vi.fn(),
        isEnhancing: false,
        isSuccess: false,
        isError: false,
        error: null,
        data: undefined,
        reset: vi.fn(),
    })),
}))

describe("AdvancedSettings", () => {
    const defaultProps = {
        open: false,
        onOpenChange: vi.fn(),
        mainPrompt: "test prompt",
        negativePrompt: "",
        onNegativePromptChange: vi.fn(),
        transparent: false,
        onTransparentChange: vi.fn(),
        nologo: false,
        onNologoChange: vi.fn(),
        enhance: false,
        onEnhanceChange: vi.fn(),
        privateGen: false,
        onPrivateChange: vi.fn(),
        safe: false,
        onSafeChange: vi.fn(),
        guidanceScale: undefined as number | undefined,
        onGuidanceScaleChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the trigger button", () => {
        render(<AdvancedSettings {...defaultProps} />)
        
        expect(screen.getByTestId("advanced-settings-trigger")).toBeInTheDocument()
        expect(screen.getByText("Advanced Settings")).toBeInTheDocument()
    })

    it("calls onOpenChange when trigger is clicked", async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<AdvancedSettings {...defaultProps} onOpenChange={onOpenChange} />)
        
        await user.click(screen.getByTestId("advanced-settings-trigger"))
        
        expect(onOpenChange).toHaveBeenCalledWith(true)
    })

    it("shows content when open is true", () => {
        render(<AdvancedSettings {...defaultProps} open />)
        
        expect(screen.getByTestId("advanced-settings-content")).toBeInTheDocument()
        expect(screen.getByTestId("negative-prompt-input")).toBeInTheDocument()
        expect(screen.getByTestId("guidance-scale-slider")).toBeInTheDocument()
    })

    it("hides content when open is false", () => {
        render(<AdvancedSettings {...defaultProps} />)
        
        // Radix Collapsible renders content but hides it with hidden attribute
        const content = screen.queryByTestId("advanced-settings-content")
        expect(content).toHaveAttribute("hidden")
    })

    it("renders all toggle switches when open", () => {
        render(<AdvancedSettings {...defaultProps} open />)
        
        expect(screen.getByTestId("transparent-switch")).toBeInTheDocument()
        expect(screen.getByTestId("nologo-switch")).toBeInTheDocument()
        expect(screen.getByTestId("enhance-switch")).toBeInTheDocument()
        expect(screen.getByTestId("private-switch")).toBeInTheDocument()
        expect(screen.getByTestId("safe-switch")).toBeInTheDocument()
    })

    it("displays negative prompt value", () => {
        render(
            <AdvancedSettings
                {...defaultProps}
                open
                negativePrompt="blurry, low quality"
            />
        )
        
        expect(screen.getByTestId("negative-prompt-input")).toHaveValue(
            "blurry, low quality"
        )
    })

    it("calls onNegativePromptChange when input changes", async () => {
        const user = userEvent.setup()
        const onNegativePromptChange = vi.fn()
        render(
            <AdvancedSettings
                {...defaultProps}
                open
                onNegativePromptChange={onNegativePromptChange}
            />
        )
        
        await user.type(screen.getByTestId("negative-prompt-input"), "test")
        
        expect(onNegativePromptChange).toHaveBeenCalled()
    })

    it("displays guidance scale value or Auto", () => {
        const { rerender } = render(<AdvancedSettings {...defaultProps} open />)
        
        expect(screen.getByText("Auto")).toBeInTheDocument()
        
        rerender(
            <AdvancedSettings {...defaultProps} open guidanceScale={12} />
        )
        
        expect(screen.getByText("12")).toBeInTheDocument()
    })

    it("calls toggle handlers when switches are clicked", async () => {
        const user = userEvent.setup()
        const onTransparentChange = vi.fn()
        const onNologoChange = vi.fn()
        const onEnhanceChange = vi.fn()
        const onPrivateChange = vi.fn()
        const onSafeChange = vi.fn()

        render(
            <AdvancedSettings
                {...defaultProps}
                open
                onTransparentChange={onTransparentChange}
                onNologoChange={onNologoChange}
                onEnhanceChange={onEnhanceChange}
                onPrivateChange={onPrivateChange}
                onSafeChange={onSafeChange}
            />
        )
        
        await user.click(screen.getByTestId("transparent-switch"))
        expect(onTransparentChange).toHaveBeenCalledWith(true)
        
        await user.click(screen.getByTestId("nologo-switch"))
        expect(onNologoChange).toHaveBeenCalledWith(true)
        
        await user.click(screen.getByTestId("enhance-switch"))
        expect(onEnhanceChange).toHaveBeenCalledWith(true)
        
        await user.click(screen.getByTestId("private-switch"))
        expect(onPrivateChange).toHaveBeenCalledWith(true)
        
        await user.click(screen.getByTestId("safe-switch"))
        expect(onSafeChange).toHaveBeenCalledWith(true)
    })

    it("disables all controls when disabled prop is true", () => {
        render(<AdvancedSettings {...defaultProps} open disabled />)
        
        expect(screen.getByTestId("negative-prompt-input")).toBeDisabled()
        expect(screen.getByTestId("guidance-scale-slider")).toHaveAttribute(
            "aria-disabled",
            "true"
        )
        expect(screen.getByTestId("transparent-switch")).toBeDisabled()
        expect(screen.getByTestId("nologo-switch")).toBeDisabled()
        expect(screen.getByTestId("enhance-switch")).toBeDisabled()
        expect(screen.getByTestId("private-switch")).toBeDisabled()
        expect(screen.getByTestId("safe-switch")).toBeDisabled()
    })

    it("shows correct toggle descriptions", () => {
        render(<AdvancedSettings {...defaultProps} open />)
        
        expect(screen.getByText("Generate PNG with transparency")).toBeInTheDocument()
        expect(screen.getByText("Remove Pollinations logo")).toBeInTheDocument()
        expect(screen.getByText("Let AI improve your prompt")).toBeInTheDocument()
        expect(screen.getByText("Hide from public feeds")).toBeInTheDocument()
        expect(screen.getByText("Enable content safety filters")).toBeInTheDocument()
    })

    it("rotates chevron when open", () => {
        const { rerender } = render(<AdvancedSettings {...defaultProps} />)
        
        const trigger = screen.getByTestId("advanced-settings-trigger")
        const chevron = trigger.querySelector("svg")
        expect(chevron).not.toHaveClass("rotate-180")
        
        rerender(
            <AdvancedSettings {...defaultProps} open />
        )
        
        const openChevron = screen.getByTestId("advanced-settings-trigger").querySelector("svg")
        expect(openChevron).toHaveClass("rotate-180")
    })
})
