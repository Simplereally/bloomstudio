import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup, ButtonGroupText, ButtonGroupSeparator } from "./button-group";

// Mock Separator since it's used internally
vi.mock("@/components/ui/separator", () => ({
    Separator: (props: any) => <div data-testid="separator" {...props} />
}));

describe("ButtonGroup", () => {
    it("renders children correctly", () => {
        render(
            <ButtonGroup>
                <button>Button 1</button>
                <button>Button 2</button>
            </ButtonGroup>
        );
        expect(screen.getByText("Button 1")).toBeInTheDocument();
        expect(screen.getByText("Button 2")).toBeInTheDocument();
        expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("applies horizontal orientation styles by default", () => {
        const { container } = render(<ButtonGroup />);
        const group = container.firstChild as HTMLElement;
        // Default CVA variant applies horizontal styles, but prop remains undefined unless defaultProps used (not typical in func comps)
        // Check for absence of vertical class
        expect(group).not.toHaveClass("flex-col");
    });

    it("applies vertical orientation styles", () => {
        const { container } = render(<ButtonGroup orientation="vertical" />);
        const group = container.firstChild as HTMLElement;
        expect(group).toHaveAttribute("data-orientation", "vertical");
        expect(group).toHaveClass("flex-col");
    });

    it("renders ButtonGroupText", () => {
        render(<ButtonGroupText>Text Content</ButtonGroupText>);
        expect(screen.getByText("Text Content")).toBeInTheDocument();
    });

    it("renders ButtonGroupSeparator", () => {
        render(<ButtonGroupSeparator />);
        expect(screen.getByTestId("separator")).toBeInTheDocument();
    });
});
