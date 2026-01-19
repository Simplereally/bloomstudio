import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnhanceButton } from "./enhance-button";

// Mock Tooltip components
vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
    TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
}));

describe("EnhanceButton", () => {
    const defaultProps = {
        isEnhancing: false,
        onEnhance: vi.fn(),
        onCancel: vi.fn(),
    };

    it("renders wand icon when not enhancing", () => {
        render(<EnhanceButton {...defaultProps} />);
        expect(screen.getByTestId("enhance-button-wand")).toBeInTheDocument();
        expect(screen.getByLabelText("Enhance with AI")).toBeInTheDocument();
    });

    it("renders spinner/sqaure when enhancing", () => {
        render(<EnhanceButton {...defaultProps} isEnhancing={true} />);
        expect(screen.getByTestId("enhance-button-stop")).toBeInTheDocument();
        expect(screen.getByLabelText("Stop enhancement")).toBeInTheDocument();
    });

    it("calls onEnhance when clicked and not enhancing", () => {
        const onEnhance = vi.fn();
        render(<EnhanceButton {...defaultProps} onEnhance={onEnhance} />);
        
        fireEvent.click(screen.getByTestId("enhance-button-wand"));
        expect(onEnhance).toHaveBeenCalled();
    });

    it("calls onCancel when clicked and enhancing", () => {
        const onCancel = vi.fn();
        render(<EnhanceButton {...defaultProps} isEnhancing={true} onCancel={onCancel} />);
        
        fireEvent.click(screen.getByTestId("enhance-button-stop"));
        expect(onCancel).toHaveBeenCalled();
    });

    it("is disabled when disabled prop is set and not enhancing", () => {
        render(<EnhanceButton {...defaultProps} disabled={true} />);
        expect(screen.getByTestId("enhance-button-wand")).toBeDisabled();
    });

    it("is NOT disabled when disabled prop is set AND enhancing", () => {
        // We want to allow cancelling even if disabled
        render(<EnhanceButton {...defaultProps} disabled={true} isEnhancing={true} />);
        expect(screen.getByTestId("enhance-button-stop")).not.toBeDisabled();
    });
});
