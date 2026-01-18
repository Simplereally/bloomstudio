"use client";

/**
 * MobileHistorySheet - Right side sheet for image history on mobile
 *
 * A side drawer (using radix Sheet) that displays:
 * - Image gallery/history
 * - Selection mode for bulk actions
 *
 * Features:
 * - Slides in from the right edge
 * - Sticky header with brand typography
 * - Full-height gallery view
 * - Dark glass effect matching studio theme
 * - Integrates with selection mode in parent
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface MobileHistorySheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Content to render inside the sheet (typically GalleryFeature) */
  children: React.ReactNode;
  /** Title to display in the header */
  title?: string;
  /** Additional class names */
  className?: string;
}

/**
 * MobileHistorySheet - The main right-side history sheet component
 */
export function MobileHistorySheet({
  open,
  onOpenChange,
  children,
  title = "Your Creations",
  className,
}: MobileHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          // Override default width for mobile - use most of the screen
          "w-[85vw] sm:w-[400px] sm:max-w-[400px]",
          // Override max-width to allow larger on mobile
          "max-w-[85vw] sm:max-w-[400px]",
          // Full height with safe area support
          "h-full",
          // Dark glass effect matching studio theme
          "bg-card/95 backdrop-blur-xl",
          // Subtle border for depth
          "border-l border-border/30",
          // Remove default padding so children can control it
          "p-0",
          // Flex layout for header + scrollable content
          "flex flex-col",
          className,
        )}
        data-testid="mobile-history-sheet"
      >
        {/* Sticky header with dark theme */}
        <SheetHeader className="px-4 py-3 border-b border-border/20 bg-card/50 shrink-0">
          <SheetTitle className="font-brand text-xl text-left text-foreground">
            {title}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable gallery content */}
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
