"use client";

/**
 * MobileHistoryDrawer - Bottom sheet drawer for image history on mobile
 *
 * A bottom drawer (using vaul) that displays:
 * - Image gallery/history
 * - Selection mode for bulk actions
 *
 * Features:
 * - Ergonomic bottom sheet design for thumb-first interaction
 * - Snap points for partial/full expansion
 * - Dark glass effect backdrop matching studio theme
 * - Integrates with selection mode in parent
 * - Provides visibility context to children for controlling infinite scroll
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

/**
 * Context to provide drawer visibility state to children.
 *
 * This is critical for mobile infinite scroll behavior:
 * - vaul drawer always renders children (even when closed)
 * - Without this context, intersection observers trigger on drawer open
 * - Children can use this to delay/reset infinite scroll observers
 */
interface MobileDrawerVisibilityContextValue {
  /** Whether the drawer is currently open/visible */
  isVisible: boolean;
}

const MobileDrawerVisibilityContext = React.createContext<
  MobileDrawerVisibilityContextValue | undefined
>(undefined);

/**
 * Hook to access the mobile drawer visibility state.
 * Returns undefined when not inside a MobileHistoryDrawer.
 *
 * @example
 * ```tsx
 * const drawerState = useMobileDrawerVisibility();
 * // Only enable infinite scroll when drawer is visible (or not in a drawer)
 * const shouldEnableScroll = drawerState?.isVisible ?? true;
 * ```
 */
export function useMobileDrawerVisibility():
  | MobileDrawerVisibilityContextValue
  | undefined {
  return React.useContext(MobileDrawerVisibilityContext);
}

export interface MobileHistoryDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Content to render inside the drawer (typically GalleryFeature) */
  children: React.ReactNode;
  /** Title to display in the header */
  title?: string;
  /** Additional class names */
  className?: string;
}

/**
 * MobileHistoryDrawer - The main bottom sheet history component
 */
export function MobileHistoryDrawer({
  open,
  onOpenChange,
  children,
  title = "Your Creations",
  className,
}: MobileHistoryDrawerProps) {
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

  // Memoize context value to prevent unnecessary re-renders
  const visibilityContextValue = React.useMemo(
    () => ({ isVisible: open }),
    [open],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      // Snap points: 50% for quick access, full height for detailed viewing
      snapPoints={SNAP_POINTS as unknown as (number | string)[]}
      // Controlled snap point
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      // Fade the background
      modal={true}
      // Note: Animation speed is controlled via CSS in globals.css (200ms vs default 500ms)
    >
      <DrawerContent
        className={cn(
          // Override max-height to use dynamic viewport height
          "max-h-[85dvh]",
          // Dark glass effect matching studio theme
          "bg-card/95 backdrop-blur-xl",
          // Subtle border for depth
          "border-t border-border/30",
          className,
        )}
        data-testid="mobile-history-drawer"
      >
        <DrawerHeader className="pb-2 border-b border-border/20">
          <DrawerTitle className="font-brand text-lg text-foreground text-left">
            {title}
          </DrawerTitle>
        </DrawerHeader>

        {/* Scrollable content area - native scroll for better touch handling */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col overscroll-contain">
          {/* Provide drawer visibility to children for infinite scroll control */}
          <MobileDrawerVisibilityContext.Provider
            value={visibilityContextValue}
          >
            {children}
          </MobileDrawerVisibilityContext.Provider>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
