import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichTooltipContent, Tooltip, TooltipTrigger, TooltipProvider } from "./rich-tooltip";

// Mock Tooltip components from @/components/ui/tooltip since they are re-exported
vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <button>{children}</button>,
    TooltipContent: ({ children, className }: any) => <div data-testid="tooltip-content" className={className}>{children}</div>,
    TooltipProvider: ({ children }: any) => <div>{children}</div>
}));

describe("RichTooltipContent", () => {
    it("renders children and applies classes", () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <RichTooltipContent className="custom-class">
                        Content
                    </RichTooltipContent>
                </Tooltip>
            </TooltipProvider>
        );

        const content = screen.getByTestId("tooltip-content");
        expect(content).toHaveTextContent("Content");
        expect(content).toHaveClass("custom-class");
        expect(content).toHaveClass("bg-popover");
        // Check for the specific shadow class used in source
        expect(content).toHaveClass("shadow-[0_20px_60px_0px_rgba(0,0,0,0.8)]");
    });
});
