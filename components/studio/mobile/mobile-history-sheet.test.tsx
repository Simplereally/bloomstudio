/**
 * @vitest-environment jsdom
 *
 * Tests for MobileHistorySheet Component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileHistorySheet } from "./mobile-history-sheet";

// Mock radix sheet components
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="sheet-root" data-open={open}>
        {children}
      </div>
    ) : null,
  SheetContent: ({
    children,
    side,
    className,
    "data-testid": testId,
  }: {
    children: React.ReactNode;
    side?: string;
    className?: string;
    "data-testid"?: string;
  }) => (
    <div
      data-testid={testId || "sheet-content"}
      data-side={side}
      className={className}
    >
      {children}
    </div>
  ),
  SheetHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="sheet-header" className={className}>
      {children}
    </div>
  ),
  SheetTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h2 data-testid="sheet-title" className={className}>
      {children}
    </h2>
  ),
}));

describe("MobileHistorySheet", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    children: <div data-testid="sheet-children">Gallery Content</div>,
  };

  describe("Rendering", () => {
    it("renders the sheet when open is true", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      expect(screen.getByTestId("mobile-history-sheet")).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      render(<MobileHistorySheet {...defaultProps} open={false} />);

      expect(
        screen.queryByTestId("mobile-history-sheet"),
      ).not.toBeInTheDocument();
    });

    it("renders children content", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      expect(screen.getByTestId("sheet-children")).toBeInTheDocument();
      expect(screen.getByText("Gallery Content")).toBeInTheDocument();
    });

    it("renders the default title", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      expect(screen.getByTestId("sheet-title")).toBeInTheDocument();
      expect(screen.getByText("Your Creations")).toBeInTheDocument();
    });

    it("renders custom title when provided", () => {
      render(<MobileHistorySheet {...defaultProps} title="My Gallery" />);

      expect(screen.getByText("My Gallery")).toBeInTheDocument();
    });

    it("renders the sheet header", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      expect(screen.getByTestId("sheet-header")).toBeInTheDocument();
    });
  });

  describe("Sheet Configuration", () => {
    it("renders sheet content with right side positioning", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      const content = screen.getByTestId("mobile-history-sheet");
      expect(content).toHaveAttribute("data-side", "right");
    });

    it("applies glass effect classes", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      const content = screen.getByTestId("mobile-history-sheet");
      expect(content).toHaveClass("bg-card/95");
      expect(content).toHaveClass("backdrop-blur-xl");
    });

    it("applies flex layout classes", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      const content = screen.getByTestId("mobile-history-sheet");
      expect(content).toHaveClass("flex");
      expect(content).toHaveClass("flex-col");
    });
  });

  describe("Custom className", () => {
    it("applies custom className to sheet content", () => {
      render(
        <MobileHistorySheet {...defaultProps} className="custom-sheet-class" />,
      );

      expect(screen.getByTestId("mobile-history-sheet")).toHaveClass(
        "custom-sheet-class",
      );
    });

    it("merges custom className with default classes", () => {
      render(
        <MobileHistorySheet {...defaultProps} className="custom-sheet-class" />,
      );

      const content = screen.getByTestId("mobile-history-sheet");
      expect(content).toHaveClass("custom-sheet-class");
      expect(content).toHaveClass("bg-card/95");
    });
  });

  describe("Title Variations", () => {
    it("renders with empty title", () => {
      render(<MobileHistorySheet {...defaultProps} title="" />);

      expect(screen.getByTestId("sheet-title")).toBeInTheDocument();
      expect(screen.getByTestId("sheet-title")).toHaveTextContent("");
    });

    it("renders with long title", () => {
      const longTitle =
        "This is a very long title that should still render correctly";
      render(<MobileHistorySheet {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  describe("Header Styling", () => {
    it("applies font-brand class to title", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      expect(screen.getByTestId("sheet-title")).toHaveClass("font-brand");
    });

    it("applies border to header", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      expect(screen.getByTestId("sheet-header")).toHaveClass("border-b");
    });
  });

  describe("Children Rendering", () => {
    it("renders complex children", () => {
      render(
        <MobileHistorySheet {...defaultProps}>
          <div data-testid="gallery-container">
            <div data-testid="gallery-item-1">Item 1</div>
            <div data-testid="gallery-item-2">Item 2</div>
            <div data-testid="gallery-item-3">Item 3</div>
          </div>
        </MobileHistorySheet>,
      );

      expect(screen.getByTestId("gallery-container")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-item-2")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-item-3")).toBeInTheDocument();
    });

    it("renders multiple children elements", () => {
      render(
        <MobileHistorySheet {...defaultProps}>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </MobileHistorySheet>,
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("renders with no children", () => {
      render(
        <MobileHistorySheet open={true} onOpenChange={mockOnOpenChange}>
          {null}
        </MobileHistorySheet>,
      );

      expect(screen.getByTestId("mobile-history-sheet")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has sheet title for screen readers", () => {
      render(<MobileHistorySheet {...defaultProps} />);

      // Sheet title acts as accessible name
      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    });
  });
});
