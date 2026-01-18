"use client";

/**
 * MobileEditorDrawer - Bottom sheet drawer for editor controls on mobile
 *
 * A bottom drawer (using vaul) that contains:
 * - Prompt input (primary focus)
 * - Generation controls (model, dimensions, options, etc.)
 *
 * The editor content itself includes the Generate button with batch controls,
 * so this wrapper does not add duplicate generation UI.
 *
 * Features:
 * - Ergonomic bottom sheet design for thumb-first interaction
 * - Keyboard-safe: vaul handles virtual keyboard pushing the sheet up
 * - Snap points for partial/full expansion
 * - Dark glass effect backdrop matching studio theme
 */

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import * as React from "react";

// Snap point constants
const SNAP_POINTS = [0.5, 1] as const;
const DEFAULT_SNAP_POINT = 1; // Open fully expanded by default

export interface MobileEditorDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Content to render inside the drawer (typically PromptFeature + ControlsFeature with built-in Generate button) */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * MobileEditorDrawer - The main bottom sheet editor component
 */
export function MobileEditorDrawer({
  open,
  onOpenChange,
  children,
  className,
}: MobileEditorDrawerProps) {
  // Controlled snap point state
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<
    number | string | null
  >(DEFAULT_SNAP_POINT);

  // Reset to full height when drawer opens
  // This ensures consistent UX - drawer always opens fully expanded
  React.useEffect(() => {
    if (open) {
      setActiveSnapPoint(DEFAULT_SNAP_POINT);
    }
  }, [open]);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      // Snap points: 50% for quick access, full height for detailed editing
      snapPoints={SNAP_POINTS as unknown as (number | string)[]}
      // Controlled snap point - prevents glitchy jump when dragging down
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      // Fade the background
      modal={true}
      // Lower z-index to allow popovers (z-50) to appear above
      // Mobile-specific component doesn't need to compete with global overlays
      dismissible={true}
      // Note: Animation speed is controlled via CSS in globals.css (200ms vs default 500ms)
    >
      <DrawerContent
        className={cn(
          // Override max-height to use dynamic viewport height
          "h-[85dvh] max-h-[85dvh]",
          // Lower z-index (z-40) to allow popovers (z-50) to appear above
          // Mobile-specific component doesn't need to compete with global overlays
          "!z-40",
          // Dark glass effect matching studio theme
          "bg-card/95 backdrop-blur-xl",
          // Subtle border for depth
          "border-t border-border/30",
          className,
        )}
        overlayClassName="!z-40"
        data-testid="mobile-editor-drawer"
      >
        <DrawerHeader className="pb-2 border-b border-border/20">
          <DrawerTitle className="font-brand text-lg text-foreground">
            Editor
          </DrawerTitle>
        </DrawerHeader>

        {/* Scrollable content area - native scroll for better touch handling */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-4 py-4">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
