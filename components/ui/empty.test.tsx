/**
 * Tests for Empty component set
 *
 * Tests the empty state display components.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "./empty";

describe("Empty", () => {
  describe("rendering", () => {
    it("renders children", () => {
      render(<Empty>Empty content</Empty>);
      expect(screen.getByText("Empty content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<Empty data-testid="empty" />);
      expect(screen.getByTestId("empty")).toHaveAttribute("data-slot", "empty");
    });
  });

  describe("styling", () => {
    it("applies flex layout centered", () => {
      render(<Empty data-testid="empty" />);
      const element = screen.getByTestId("empty");
      expect(element).toHaveClass("flex");
      expect(element).toHaveClass("items-center");
      expect(element).toHaveClass("justify-center");
    });

    it("has dashed border styling", () => {
      render(<Empty data-testid="empty" />);
      expect(screen.getByTestId("empty")).toHaveClass("border-dashed");
    });

    it("accepts custom className", () => {
      render(<Empty data-testid="empty" className="custom-empty" />);
      expect(screen.getByTestId("empty")).toHaveClass("custom-empty");
    });
  });
});

describe("EmptyHeader", () => {
  it("renders children", () => {
    render(<EmptyHeader>Header Content</EmptyHeader>);
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<EmptyHeader data-testid="header" />);
    expect(screen.getByTestId("header")).toHaveAttribute(
      "data-slot",
      "empty-header"
    );
  });

  it("centers text", () => {
    render(<EmptyHeader data-testid="header" />);
    expect(screen.getByTestId("header")).toHaveClass("text-center");
  });
});

describe("EmptyTitle", () => {
  it("renders title text", () => {
    render(<EmptyTitle>No Results</EmptyTitle>);
    expect(screen.getByText("No Results")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<EmptyTitle data-testid="title" />);
    expect(screen.getByTestId("title")).toHaveAttribute(
      "data-slot",
      "empty-title"
    );
  });

  it("applies font styling", () => {
    render(<EmptyTitle data-testid="title" />);
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("font-medium");
    expect(title).toHaveClass("text-lg");
  });
});

describe("EmptyDescription", () => {
  it("renders description text", () => {
    render(<EmptyDescription>Try a different search</EmptyDescription>);
    expect(screen.getByText("Try a different search")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<EmptyDescription data-testid="desc" />);
    expect(screen.getByTestId("desc")).toHaveAttribute(
      "data-slot",
      "empty-description"
    );
  });

  it("uses muted text color", () => {
    render(<EmptyDescription data-testid="desc" />);
    expect(screen.getByTestId("desc")).toHaveClass("text-muted-foreground");
  });

  it("renders with links styled correctly", () => {
    render(
      <EmptyDescription>
        <a href="/help">Get help</a>
      </EmptyDescription>
    );
    expect(screen.getByRole("link", { name: "Get help" })).toBeInTheDocument();
  });
});

describe("EmptyContent", () => {
  it("renders children", () => {
    render(<EmptyContent>Content area</EmptyContent>);
    expect(screen.getByText("Content area")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<EmptyContent data-testid="content" />);
    expect(screen.getByTestId("content")).toHaveAttribute(
      "data-slot",
      "empty-content"
    );
  });

  it("has constrained max-width", () => {
    render(<EmptyContent data-testid="content" />);
    expect(screen.getByTestId("content")).toHaveClass("max-w-sm");
  });
});

describe("EmptyMedia", () => {
  it("renders children (icons)", () => {
    render(
      <EmptyMedia>
        <svg data-testid="icon" />
      </EmptyMedia>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("has data-slot attribute", () => {
    render(<EmptyMedia data-testid="media" />);
    // Note: The component uses "empty-icon" as the slot name
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-slot",
      "empty-icon"
    );
  });

  describe("variants", () => {
    it("applies default variant", () => {
      render(<EmptyMedia data-testid="media" />);
      expect(screen.getByTestId("media")).toHaveAttribute(
        "data-variant",
        "default"
      );
    });

    it("applies icon variant", () => {
      render(<EmptyMedia data-testid="media" variant="icon" />);
      const media = screen.getByTestId("media");
      expect(media).toHaveAttribute("data-variant", "icon");
      expect(media).toHaveClass("bg-muted");
      expect(media).toHaveClass("rounded-lg");
    });
  });
});

describe("Empty compound usage", () => {
  it("renders a complete empty state", () => {
    render(
      <Empty data-testid="empty">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg data-testid="search-icon" />
          </EmptyMedia>
          <EmptyTitle>No images found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your search or generate new images
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button type="button">Generate</button>
        </EmptyContent>
      </Empty>
    );

    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    expect(screen.getByText("No images found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or generate new images")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate" })
    ).toBeInTheDocument();
  });
});
