import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { 
    Item, 
    ItemMedia, 
    ItemContent, 
    ItemActions, 
    ItemGroup, 
    ItemSeparator, 
    ItemTitle, 
    ItemDescription 
} from "./item";

// Mock Separator since it's used internally
vi.mock("@/components/ui/separator", () => ({
    Separator: (props: any) => <div data-testid="separator" {...props} />
}));

describe("Item", () => {
    it("renders children correctly", () => {
        render(
            <ItemGroup>
                <Item>
                    <ItemContent>
                        <ItemTitle>Title</ItemTitle>
                        <ItemDescription>Description</ItemDescription>
                    </ItemContent>
                </Item>
            </ItemGroup>
        );
        expect(screen.getByRole("list")).toBeInTheDocument();
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders ItemMedia correctly", () => {
        render(<ItemMedia>Icon</ItemMedia>);
        expect(screen.getByText("Icon")).toBeInTheDocument();
    });

    it("renders ItemActions correctly", () => {
        render(<ItemActions>Action</ItemActions>);
        expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("renders ItemSeparator correctly", () => {
        render(<ItemSeparator />);
        expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("supports asChild prop for Item", () => {
        render(
            <Item asChild>
                <a href="#">Link Item</a>
            </Item>
        );
        const link = screen.getByText("Link Item");
        expect(link.tagName).toBe("A");
        expect(link).toHaveAttribute("data-slot", "item");
    });
});
