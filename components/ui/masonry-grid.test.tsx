import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MasonryGrid } from "./masonry-grid";

describe("MasonryGrid", () => {
    beforeAll(() => {
        // Mock ResizeObserver
        global.ResizeObserver = class ResizeObserver {
            observe() {}
            unobserve() {}
            disconnect() {}
        };

        // Mock offsetWidth
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
            configurable: true,
            value: 1200
        });
    });

    it("renders children", () => {
        render(
            <MasonryGrid>
                <div data-testid="item">Item</div>
            </MasonryGrid>
        );
        expect(screen.getByTestId("item")).toBeInTheDocument();
    });

    it("calculates columns based on width", () => {
        // Width 1200, minColWidth 280, gap 8
        // (1200+8) / (288) = 4.19 -> 4 cols
        const { container } = render(
            <MasonryGrid minColumnWidth={280} gap={8}>
                <div>1</div>
                <div>2</div>
                <div>3</div>
                <div>4</div>
            </MasonryGrid>
        );
        
        // We expect the grid to have 4 column divs
        const grid = container.firstChild;
        expect(grid?.childNodes.length).toBe(4);
    });

    it("handles no children", () => {
        const { container } = render(<MasonryGrid>{null}</MasonryGrid>);
        expect(container.firstChild).toBeInTheDocument();
    });
});
