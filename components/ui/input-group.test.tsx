import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { 
    InputGroup, 
    InputGroupAddon, 
    InputGroupButton, 
    InputGroupText, 
    InputGroupInput, 
    InputGroupTextarea 
} from "./input-group";

// Mock Input, Textarea, Button
vi.mock("@/components/ui/input", () => ({ 
    Input: (props: any) => <input data-testid="input" {...props} /> 
}));
vi.mock("@/components/ui/textarea", () => ({ 
    Textarea: (props: any) => <textarea data-testid="textarea" {...props} /> 
}));
vi.mock("@/components/ui/button", () => ({ 
    Button: (props: any) => <button data-testid="button" {...props} /> 
}));

describe("InputGroup", () => {
    it("renders children correctly", () => {
        render(
            <InputGroup>
                <InputGroupInput placeholder="test" />
            </InputGroup>
        );
        expect(screen.getByTestId("input")).toBeInTheDocument();
        expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("renders textarea correctly", () => {
        render(
            <InputGroup>
                <InputGroupTextarea placeholder="test" />
            </InputGroup>
        );
        expect(screen.getByTestId("textarea")).toBeInTheDocument();
    });

    it("renders addon correctly", () => {
        render(
            <InputGroup>
                <InputGroupAddon>Addon</InputGroupAddon>
                <InputGroupInput />
            </InputGroup>
        );
        expect(screen.getByText("Addon")).toBeInTheDocument();
    });

    it("focuses input when addon is clicked", () => {
        render(
            <InputGroup>
                <InputGroupAddon>Addon</InputGroupAddon>
                <InputGroupInput />
            </InputGroup>
        );
        const input = screen.getByTestId("input");
        const addon = screen.getByText("Addon");
        
        fireEvent.click(addon);
        expect(input).toHaveFocus();
    });

    it("does not focus input when clicking button in addon", () => {
        render(
            <InputGroup>
                <InputGroupAddon>
                    <button>Action</button>
                    Addon
                </InputGroupAddon>
                <InputGroupInput />
            </InputGroup>
        );
        const input = screen.getByTestId("input");
        const button = screen.getByText("Action");
        
        fireEvent.click(button);
        expect(input).not.toHaveFocus();
    });

    it("renders text correctly", () => {
        render(<InputGroupText>Text</InputGroupText>);
        expect(screen.getByText("Text")).toBeInTheDocument();
        expect(screen.getByText("Text")).toHaveClass("text-muted-foreground");
    });
    
    it("renders button correctly", () => {
        render(<InputGroupButton>Click</InputGroupButton>);
        expect(screen.getByTestId("button")).toBeInTheDocument();
        expect(screen.getByText("Click")).toBeInTheDocument();
    });
});
