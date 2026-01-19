/**
 * Tests for Spinner component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  describe("accessibility", () => {
    it("renders with status role", () => {
      render(<Spinner />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it('has accessible label "Loading"', () => {
      render(<Spinner />);
      expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies default size class", () => {
      render(<Spinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("size-4");
    });

    it("applies animation class", () => {
      render(<Spinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("animate-spin");
    });

    it("accepts custom className", () => {
      render(<Spinner className="custom-class" />);
      const spinner = screen.getByRole("status");
      expect(spinner).toHaveClass("custom-class");
    });

    it("allows overriding default size", () => {
      render(<Spinner className="size-8" />);
      const spinner = screen.getByRole("status");
      // tailwind-merge should handle the conflict
      expect(spinner).toHaveClass("size-8");
    });
  });

  describe("props passthrough", () => {
    it("passes additional SVG props", () => {
      render(<Spinner data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });
});
