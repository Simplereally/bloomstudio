"use client";

/**
 * StudioLayout - Core layout component with desktop/mobile fork
 *
 * Acts as the "traffic controller" that routes to the appropriate layout:
 * - Desktop: Uses shadcn Sidebar for collapsible, fixed-width panels
 * - Mobile: Uses MobileStudioLayout with bottom navigation and sheets
 *
 * CRITICAL: The desktop experience must remain pixel-identical to production.
 * Mobile is a parallel experience, not responsive styling.
 */

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import { MobileStudioLayout } from "../mobile/mobile-studio-layout";

export interface StudioLayoutProps {
  /** Content for the left sidebar (generation controls) */
  sidebar: React.ReactNode;
  /** Content for the main canvas area */
  canvas: React.ReactNode;
  /** Content for the gallery panel (optional) */
  gallery?: React.ReactNode;
  /** Whether the sidebar panel is visible */
  showSidebar?: boolean;
  /** Whether the gallery panel is visible */
  showGallery?: boolean;
  /** Callback when sidebar open state changes (e.g., closed via mobile overlay) */
  onSidebarOpenChange?: (open: boolean) => void;
  /** Callback when gallery open state changes (e.g., closed via mobile overlay) */
  onGalleryOpenChange?: (open: boolean) => void;
  /** Additional class names */
  className?: string;

  // Mobile-specific props
  /** Handler for triggering generation (mobile only) */
  onGenerate?: () => void;
  /** Whether generation is in progress (mobile only) */
  isGenerating?: boolean;
  /** Whether generation is disabled (mobile only) */
  isGenerateDisabled?: boolean;
  /** Batch mode settings (mobile only) */
  batchSettings?: {
    enabled: boolean;
    count: number;
  };
  /** Whether batch is active (mobile only) */
  isBatchActive?: boolean;
  /** Selection mode for gallery (mobile only) */
  selectionMode?: {
    enabled: boolean;
    count: number;
    onDelete: () => void;
    onMakePublic: () => void;
    onCancel: () => void;
  };

  // Legacy props - kept for compatibility but unused
  defaultSidebarSize?: number | string;
  defaultGallerySize?: number | string;
  minSidebarSize?: number | string;
  maxSidebarSize?: number | string;
  defaultLayout?: Record<string, number>;
}

// ============================================================================
// Desktop Layout Components (unchanged from original implementation)
// ============================================================================

/**
 * SidebarToggleButton - The actual toggle button UI.
 * Renders a semi-circle button with chevron icon that expands/collapses the sidebar.
 * Left sidebar: flat left edge sits on border, rounded right edge extends into canvas
 * Right sidebar: rounded left edge extends into canvas, flat right edge sits on border
 */
function SidebarToggleButton({
  side,
  isOpen,
  onClick,
}: {
  side: "left" | "right";
  isOpen: boolean;
  onClick: () => void;
}) {
  // Determine which chevron to show based on side and state
  const Icon =
    side === "left"
      ? isOpen
        ? ChevronLeft
        : ChevronRight
      : isOpen
        ? ChevronRight
        : ChevronLeft;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        isOpen ? `Collapse ${side} sidebar` : `Expand ${side} sidebar`
      }
      className={cn(
        // Base positioning - vertically centered
        "absolute top-1/2 -translate-y-1/2",
        // Position so flat edge is at sidebar edge, rounded part extends into canvas
        // Left sidebar: position at right edge, no transform (extends right into canvas)
        // Right sidebar: position at left edge, no transform (extends left into canvas)
        side === "left" ? "left-full" : "right-full",
        // Toggle appearance - semi-circle design
        "flex h-8 w-4 items-center justify-center",
        "bg-background border border-border shadow-md",
        "text-muted-foreground hover:text-foreground hover:border-foreground/30",
        "transition-all duration-200 ease-out",
        "hover:scale-110 active:scale-95",
        // Semi-circle rounding: left sidebar rounds right, right sidebar rounds left
        // Remove border on flat edge for seamless look
        side === "left"
          ? "rounded-r-full border-l-0 pl-0.5"
          : "rounded-l-full border-r-0 pr-0.5",
        // Focus states for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Ensure it's above everything
        "z-50",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/**
 * LeftSidebarEdgeToggle - Toggle that sits ON the sidebar's right edge when expanded.
 * Only visible when sidebar is open. Positioned relative to sidebar container.
 */
function LeftSidebarEdgeToggle() {
  const { state, toggleSidebar, openMobile, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isOpen = isMobile ? openMobile : !isCollapsed;

  // Only render when sidebar is open
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 pointer-events-none z-50">
      <div className="relative h-full pointer-events-auto">
        <SidebarToggleButton
          side="left"
          isOpen={true}
          onClick={toggleSidebar}
        />
      </div>
    </div>
  );
}

/**
 * RightSidebarEdgeToggle - Toggle that sits ON the sidebar's left edge when expanded.
 * Only visible when sidebar is open. Positioned relative to sidebar container.
 */
function RightSidebarEdgeToggle() {
  const { state, toggleSidebar, openMobile, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isOpen = isMobile ? openMobile : !isCollapsed;

  // Only render when sidebar is open
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 pointer-events-none z-50">
      <div className="relative h-full pointer-events-auto">
        <SidebarToggleButton
          side="right"
          isOpen={true}
          onClick={toggleSidebar}
        />
      </div>
    </div>
  );
}

/**
 * CanvasEdgeToggle - Toggle that appears at the canvas edge when sidebar is collapsed.
 * Positioned at the edge of the canvas area to allow reopening collapsed sidebars.
 */
function CanvasEdgeToggle({ side }: { side: "left" | "right" }) {
  const { state, toggleSidebar, openMobile, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isOpen = isMobile ? openMobile : !isCollapsed;

  // Only render when sidebar is collapsed
  if (isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-y-0 z-50 pointer-events-none",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <div className="relative h-full pointer-events-auto">
        <SidebarToggleButton
          side={side}
          isOpen={false}
          onClick={toggleSidebar}
        />
      </div>
    </div>
  );
}

/**
 * DesktopStudioLayout - The original desktop layout (unchanged)
 * This is extracted to keep the desktop experience exactly as before.
 */
function DesktopStudioLayout({
  sidebar,
  canvas,
  gallery,
  showSidebar = true,
  showGallery = true,
  onSidebarOpenChange,
  onGalleryOpenChange,
  className,
}: Pick<
  StudioLayoutProps,
  | "sidebar"
  | "canvas"
  | "gallery"
  | "showSidebar"
  | "showGallery"
  | "onSidebarOpenChange"
  | "onGalleryOpenChange"
  | "className"
>) {
  return (
    <div
      className={cn("flex h-full w-full overflow-hidden", className)}
      data-testid="studio-layout"
    >
      {/* Left Sidebar Provider */}
      <SidebarProvider
        open={showSidebar}
        defaultOpen={showSidebar}
        onOpenChange={onSidebarOpenChange}
        cookieName="studio-sidebar-state"
        className="!h-full !min-h-0 w-full relative"
        style={
          {
            "--sidebar-width": "360px",
            "--sidebar-width-icon": "0px",
          } as React.CSSProperties
        }
      >
        <Sidebar
          side="left"
          collapsible="offcanvas"
          className="!absolute !h-full border-r border-border/50 z-40"
          data-testid="studio-sidebar-panel"
        >
          <SidebarContent className="h-full min-h-0 overflow-hidden">
            {sidebar}
          </SidebarContent>
          {/* Toggle straddling sidebar's right edge - only visible when open */}
          <LeftSidebarEdgeToggle />
        </Sidebar>

        <SidebarInset className="h-full min-h-0 min-w-0 flex-1 overflow-hidden relative">
          {/* Left sidebar toggle - shown when left sidebar is collapsed */}
          <CanvasEdgeToggle side="left" />

          {/* Right Sidebar Provider (Nested) */}
          <SidebarProvider
            open={showGallery && !!gallery}
            defaultOpen={showGallery && !!gallery}
            onOpenChange={onGalleryOpenChange}
            cookieName="studio-gallery-state"
            className="!h-full !min-h-0 w-full relative"
            style={
              {
                "--sidebar-width": "320px",
                "--sidebar-width-icon": "0px",
              } as React.CSSProperties
            }
          >
            <SidebarInset className="h-full min-h-0 min-w-0 flex-1 overflow-hidden relative">
              {/* Right sidebar toggle - shown when right sidebar is collapsed */}
              {gallery && <CanvasEdgeToggle side="right" />}

              <div className="h-full w-full" data-testid="studio-canvas-panel">
                {canvas}
              </div>
            </SidebarInset>

            {gallery && (
              <Sidebar
                side="right"
                collapsible="offcanvas"
                className="!absolute !h-full border-l border-border/50 bg-card/50"
                data-testid="studio-gallery-panel"
              >
                <SidebarContent className="h-full min-h-0 overflow-hidden">
                  {gallery}
                </SidebarContent>
                {/* Toggle straddling sidebar's left edge - only visible when open */}
                <RightSidebarEdgeToggle />
              </Sidebar>
            )}
          </SidebarProvider>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// ============================================================================
// Main StudioLayout - Traffic Controller
// ============================================================================

export function StudioLayout({
  sidebar,
  canvas,
  gallery,
  showSidebar = true,
  showGallery = true,
  onSidebarOpenChange,
  onGalleryOpenChange,
  className,
  // Mobile-specific props
  onGenerate,
  isGenerating,
  isGenerateDisabled,
  batchSettings,
  isBatchActive,
  selectionMode,
}: StudioLayoutProps) {
  const isMobile = useIsMobile();

  // ========================================================================
  // MOBILE LAYOUT
  // Uses MobileStudioLayout with bottom navigation and sheets
  // ========================================================================
  if (isMobile) {
    return (
      <MobileStudioLayout
        canvas={canvas}
        editorContent={sidebar}
        historyContent={gallery ?? <div />}
        isEditorOpen={showSidebar}
        onEditorOpenChange={onSidebarOpenChange ?? (() => {})}
        isHistoryOpen={showGallery && !!gallery}
        onHistoryOpenChange={onGalleryOpenChange ?? (() => {})}
        onGenerate={onGenerate ?? (() => {})}
        isGenerating={isGenerating}
        isGenerateDisabled={isGenerateDisabled}
        batchSettings={batchSettings}
        isBatchActive={isBatchActive}
        selectionMode={selectionMode}
        className={className}
      />
    );
  }

  // ========================================================================
  // DESKTOP LAYOUT
  // Exact same implementation as before - pixel-identical to production
  // ========================================================================
  return (
    <DesktopStudioLayout
      sidebar={sidebar}
      canvas={canvas}
      gallery={gallery}
      showSidebar={showSidebar}
      showGallery={showGallery}
      onSidebarOpenChange={onSidebarOpenChange}
      onGalleryOpenChange={onGalleryOpenChange}
      className={className}
    />
  );
}
