/**
 * Tests for Kbd and KbdGroup components
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kbd, KbdGroup } from "./kbd";

describe("Kbd", () => {
  describe("rendering", () => {
    it("renders children text", () => {
      render(<Kbd>Ctrl</Kbd>);
      expect(screen.getByText("Ctrl")).toBeInTheDocument();
    });

    it("renders as kbd element", () => {
      render(<Kbd data-testid="kbd">K</Kbd>);
      const kbd = screen.getByTestId("kbd");
      expect(kbd.tagName.toLowerCase()).toBe("kbd");
    });

    it("has data-slot attribute", () => {
      render(<Kbd data-testid="kbd">K</Kbd>);
      expect(screen.getByTestId("kbd")).toHaveAttribute("data-slot", "kbd");
    });
  });

  describe("styling", () => {
    it("applies base styling classes", () => {
      render(<Kbd data-testid="kbd">K</Kbd>);
      const kbd = screen.getByTestId("kbd");
      expect(kbd).toHaveClass("bg-muted");
      expect(kbd).toHaveClass("text-muted-foreground");
      expect(kbd).toHaveClass("rounded-sm");
    });

    it("accepts custom className", () => {
      render(
        <Kbd data-testid="kbd" className="custom-class">
          K
        </Kbd>
      );
      expect(screen.getByTestId("kbd")).toHaveClass("custom-class");
    });

    it("has correct height and min-width for consistent sizing", () => {
      render(<Kbd data-testid="kbd">K</Kbd>);
      const kbd = screen.getByTestId("kbd");
      expect(kbd).toHaveClass("h-5");
      expect(kbd).toHaveClass("min-w-5");
    });
  });

  describe("complex content", () => {
    it("renders with icons", () => {
      render(
        <Kbd data-testid="kbd">
          <svg data-testid="icon" />
          <span>K</span>
        </Kbd>
      );
      expect(screen.getByTestId("kbd")).toContainElement(
        screen.getByTestId("icon")
      );
    });
  });
});

describe("KbdGroup", () => {
  describe("rendering", () => {
    it("renders multiple Kbd children", () => {
      render(
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      );
      expect(screen.getByText("Ctrl")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("renders as kbd element with group slot", () => {
      render(<KbdGroup data-testid="kbd-group" />);
      const group = screen.getByTestId("kbd-group");
      expect(group.tagName.toLowerCase()).toBe("kbd");
      expect(group).toHaveAttribute("data-slot", "kbd-group");
    });
  });

  describe("styling", () => {
    it("uses flex layout with gap", () => {
      render(<KbdGroup data-testid="kbd-group" />);
      const group = screen.getByTestId("kbd-group");
      expect(group).toHaveClass("inline-flex");
      expect(group).toHaveClass("gap-1");
    });

    it("centers items vertically", () => {
      render(<KbdGroup data-testid="kbd-group" />);
      expect(screen.getByTestId("kbd-group")).toHaveClass("items-center");
    });

    it("accepts custom className", () => {
      render(<KbdGroup data-testid="kbd-group" className="custom-class" />);
      expect(screen.getByTestId("kbd-group")).toHaveClass("custom-class");
    });
  });

  describe("keyboard shortcut display", () => {
    it("renders typical keyboard shortcut combination", () => {
      render(
        <KbdGroup data-testid="kbd-group">
          <Kbd>⌘</Kbd>
          <span>+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
      );
      expect(screen.getByText("⌘")).toBeInTheDocument();
      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
    });
  });
});
