import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudioLayout } from "./studio-layout";
import type { CSSProperties, ReactNode } from "react";

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}));

// Import the mock to manipulate it
import { useIsMobile } from "@/hooks/use-mobile";

// Mock the Sidebar components
const mockToggleSidebar = vi.fn();

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({
    children,
    open,
    "data-testid": testId,
    style,
  }: {
    children: ReactNode;
    open?: boolean;
    "data-testid"?: string;
    style?: CSSProperties;
  }) => (
    <div
      data-testid={testId || "sidebar-provider"}
      data-open={String(open)}
      style={style}
    >
      {children}
    </div>
  ),
  Sidebar: ({
    children,
    side,
    "data-testid": testId,
  }: {
    children: ReactNode;
    side?: string;
    "data-testid"?: string;
  }) => (
    <div data-testid={testId || "sidebar"} data-side={side}>
      {children}
    </div>
  ),
  SidebarContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="sidebar-content-wrapper">{children}</div>
  ),
  SidebarInset: ({ children }: { children: ReactNode }) => (
    <div data-testid="sidebar-inset">{children}</div>
  ),
  SidebarRail: ({
    className,
    children,
  }: {
    className?: string;
    children?: ReactNode;
  }) => (
    <button
      data-testid="sidebar-rail"
      className={className}
      aria-label="Toggle Sidebar"
    >
      {children}
    </button>
  ),
  useSidebar: () => ({
    toggleSidebar: mockToggleSidebar,
    open: true,
    state: "expanded",
    isMobile: false,
    openMobile: false,
  }),
}));

// Mock the MobileStudioLayout component
vi.mock("../mobile/mobile-studio-layout", () => ({
  MobileStudioLayout: ({
    canvas,
    editorContent,
    historyContent,
    isEditorOpen,
    isHistoryOpen,
    className,
  }: {
    canvas: ReactNode;
    editorContent: ReactNode;
    historyContent: ReactNode;
    isEditorOpen: boolean;
    isHistoryOpen: boolean;
    className?: string;
  }) => (
    <div data-testid="mobile-studio-layout" className={className}>
      <div data-testid="mobile-canvas">{canvas}</div>
      <div data-testid="mobile-editor" data-open={String(isEditorOpen)}>
        {editorContent}
      </div>
      <div data-testid="mobile-history" data-open={String(isHistoryOpen)}>
        {historyContent}
      </div>
    </div>
  ),
}));

describe("StudioLayout", () => {
  const mockSidebar = <div data-testid="sidebar-content">Sidebar</div>;
  const mockCanvas = <div data-testid="canvas-content">Canvas</div>;
  const mockGallery = <div data-testid="gallery-content">Gallery</div>;

  beforeEach(() => {
    mockToggleSidebar.mockClear();
    // Reset to desktop mode by default
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  describe("Desktop Layout", () => {
    it("renders sidebar and canvas correctly", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
      expect(screen.getByTestId("canvas-content")).toBeInTheDocument();
    });

    it("renders sidebar toggle button with correct aria-label", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      // The toggle button should have the updated aria-label
      const toggleButton = screen.getByRole("button", {
        name: /collapse left sidebar/i,
      });
      expect(toggleButton).toBeInTheDocument();
    });

    it("calls toggleSidebar when toggle button is clicked", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /collapse left sidebar/i,
      });
      expect(toggleButton).not.toBeNull();

      fireEvent.click(toggleButton);
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it("renders gallery when provided", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          gallery={mockGallery}
          showGallery={true}
        />,
      );

      expect(screen.getByTestId("gallery-content")).toBeInTheDocument();

      // Should have toggle buttons for both left and right sidebars
      const leftToggle = screen.getByRole("button", {
        name: /collapse left sidebar/i,
      });
      const rightToggle = screen.getByRole("button", {
        name: /collapse right sidebar/i,
      });
      expect(leftToggle).toBeInTheDocument();
      expect(rightToggle).toBeInTheDocument();
    });

    it("renders studio-layout data-testid on desktop", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("studio-layout")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
          className="custom-class"
        />,
      );

      expect(screen.getByTestId("studio-layout")).toHaveClass("custom-class");
    });
  });

  describe("Mobile Layout", () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    it("renders mobile layout when isMobile is true", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("mobile-studio-layout")).toBeInTheDocument();
    });

    it("passes canvas to mobile layout", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("mobile-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("canvas-content")).toBeInTheDocument();
    });

    it("passes sidebar as editor content to mobile layout", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("mobile-editor")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
    });

    it("passes gallery as history content to mobile layout", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          gallery={mockGallery}
          showGallery={true}
        />,
      );

      expect(screen.getByTestId("mobile-history")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-content")).toBeInTheDocument();
    });

    it("passes showSidebar as isEditorOpen to mobile layout", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("mobile-editor")).toHaveAttribute(
        "data-open",
        "true",
      );
    });

    it("passes showGallery as isHistoryOpen to mobile layout", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          gallery={mockGallery}
          showGallery={true}
        />,
      );

      expect(screen.getByTestId("mobile-history")).toHaveAttribute(
        "data-open",
        "true",
      );
    });

    it("does not render desktop sidebar on mobile", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.queryByTestId("studio-layout")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("studio-sidebar-panel"),
      ).not.toBeInTheDocument();
    });

    it("applies custom className to mobile layout", () => {
      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
          className="custom-mobile-class"
        />,
      );

      expect(screen.getByTestId("mobile-studio-layout")).toHaveClass(
        "custom-mobile-class",
      );
    });
  });

  describe("Traffic Controller Pattern", () => {
    it("renders desktop layout when useIsMobile returns false", () => {
      vi.mocked(useIsMobile).mockReturnValue(false);

      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("studio-layout")).toBeInTheDocument();
      expect(
        screen.queryByTestId("mobile-studio-layout"),
      ).not.toBeInTheDocument();
    });

    it("renders mobile layout when useIsMobile returns true", () => {
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(
        <StudioLayout
          sidebar={mockSidebar}
          canvas={mockCanvas}
          showSidebar={true}
        />,
      );

      expect(screen.getByTestId("mobile-studio-layout")).toBeInTheDocument();
      expect(screen.queryByTestId("studio-layout")).not.toBeInTheDocument();
    });
  });
});
