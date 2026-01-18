"use client";

/**
 * MobileStudioNavigation - Bottom navigation bar for mobile Studio
 *
 * A fixed bottom action bar following the "Thumb Zone" navigation pattern.
 * Houses primary navigation: Editor, Generate FAB, and History.
 *
 * Features:
 * - Dark glass effect backdrop matching studio theme
 * - Safe area inset support for iOS home indicator
 * - Elevated Generate FAB with pulse animation when generating
 * - Selection mode transforms into bulk action bar
 * - Brand typography and premium visual indicators
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  History,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Globe,
  X,
} from "lucide-react";
import * as React from "react";

export interface MobileStudioNavigationProps {
  /** Handler for opening the editor drawer */
  onOpenEditor: () => void;
  /** Handler for opening the history sheet */
  onOpenHistory: () => void;
  /** Handler for triggering generation */
  onGenerate: () => void;
  /** Whether generation is in progress */
  isGenerating?: boolean;
  /** Whether generation is disabled (e.g., no prompt) */
  isGenerateDisabled?: boolean;
  /** Whether the editor drawer is currently open */
  isEditorOpen?: boolean;
  /** Whether the history sheet is currently open */
  isHistoryOpen?: boolean;
  /** Selection mode state */
  selectionMode?: {
    enabled: boolean;
    count: number;
    onDelete: () => void;
    onMakePublic: () => void;
    onCancel: () => void;
  };
  /** Additional class names */
  className?: string;
}

/**
 * NavButton - Individual navigation button in the bottom bar
 * Features premium styling with visual clickability indicators
 */
function NavButton({
  icon: Icon,
  label,
  onClick,
  isActive,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Layout
        "flex flex-col items-center justify-center gap-1.5",
        "min-w-[72px] min-h-14 px-4 py-2.5",
        // Shape and background - visible container for clickability
        "rounded-2xl",
        // NO transitions - instant feedback for snappiest feel
        "border border-transparent",
        // Default state - subtle background to show it's interactive
        "bg-white/5 text-muted-foreground",
        // Hover state - more prominent
        "hover:bg-white/10 hover:text-foreground hover:border-white/10",
        // Active press state - ONLY background change, NO scale transform
        // Scale transforms cause browser repaints that delay onClick
        "active:bg-white/15",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Selected/active state - uses primary color
        isActive &&
          "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 hover:text-primary",
        className,
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          // Instant scale change for active state (no transition delay)
          isActive && "scale-110",
        )}
      />
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider font-brand",
          isActive ? "text-primary" : "text-inherit",
        )}
      >
        {label}
      </span>
    </button>
  );
}


/**
 * GenerateFAB - Central floating action button for generation
 * Features elevated design, gradient background, and pulse animation when generating
 */
function GenerateFAB({
  onClick,
  isGenerating,
  disabled,
}: {
  onClick: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={cn(
        // Base sizing - larger than nav buttons (56px as per spec)
        "relative flex items-center justify-center",
        "h-[60px] w-[60px] rounded-full",
        // Elevated appearance with gradient
        "bg-gradient-to-br from-primary via-primary to-primary/80",
        "text-primary-foreground",
        // Premium shadow with glow
        "shadow-lg shadow-primary/30",
        "ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
        // Interactions
        "transition-all duration-200",
        "hover:shadow-xl hover:shadow-primary/40 hover:scale-105 hover:ring-primary/30",
        "active:scale-95",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg disabled:ring-0",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Generating state - pulse animation
        isGenerating && "animate-pulse ring-primary/40",
      )}
      aria-label={isGenerating ? "Generating..." : "Generate"}
      data-testid="mobile-generate-fab"
    >
      {/* Pulse glow effect when generating */}
      {isGenerating && (
        <span
          className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30"
          aria-hidden="true"
        />
      )}
      {/* Inner glow highlight */}
      <span
        className="absolute inset-1 rounded-full bg-gradient-to-t from-transparent to-white/10 pointer-events-none"
        aria-hidden="true"
      />
      <Sparkles
        className={cn(
          "h-6 w-6 relative z-10 drop-shadow-sm",
          isGenerating && "animate-pulse",
        )}
      />
    </button>
  );
}

/**
 * SelectionModeBar - Replaces navigation when in selection mode
 * Shows bulk actions: Delete, Make Public, Cancel
 */
function SelectionModeBar({
  count,
  onDelete,
  onMakePublic,
  onCancel,
}: {
  count: number;
  onDelete: () => void;
  onMakePublic: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between w-full px-2"
      data-testid="selection-mode-bar"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Cancel</span>
      </Button>

      <span className="text-sm font-medium text-foreground">
        {count} selected
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMakePublic}
          className="gap-2 text-muted-foreground hover:text-foreground"
          disabled={count === 0}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Public</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={count === 0}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * MobileStudioNavigation - The main bottom navigation component
 */
export function MobileStudioNavigation({
  onOpenEditor,
  onOpenHistory,
  onGenerate,
  isGenerating = false,
  isGenerateDisabled = false,
  isEditorOpen = false,
  isHistoryOpen = false,
  selectionMode,
  className,
}: MobileStudioNavigationProps) {
  const isInSelectionMode = selectionMode?.enabled ?? false;

  return (
    <nav
      className={cn(
        // Fixed positioning at bottom
        "fixed bottom-0 left-0 right-0 z-40",
        // Height and padding with safe area support
        "h-20 px-3",
        // Safe area inset for iOS home indicator
        "pb-[env(safe-area-inset-bottom)]",
        // Dark glass effect styling - matches studio dark theme
        "bg-gradient-to-t from-background/95 via-background/90 to-background/80",
        "backdrop-blur-xl backdrop-saturate-150",
        "border-t border-white/[0.08]",
        // Subtle top shadow for depth
        "shadow-[0_-4px_24px_rgba(0,0,0,0.3)]",
        // Flex layout
        "flex items-center",
        isInSelectionMode ? "justify-center" : "justify-evenly",
        className,
      )}
      aria-label="Studio navigation"
      data-testid="mobile-studio-navigation"
    >
      {isInSelectionMode && selectionMode ? (
        <SelectionModeBar
          count={selectionMode.count}
          onDelete={selectionMode.onDelete}
          onMakePublic={selectionMode.onMakePublic}
          onCancel={selectionMode.onCancel}
        />
      ) : (
        <>
          <NavButton
            icon={SlidersHorizontal}
            label="Editor"
            onClick={onOpenEditor}
            isActive={isEditorOpen}
          />
          <GenerateFAB
            onClick={onGenerate}
            isGenerating={isGenerating}
            disabled={isGenerateDisabled}
          />
          <NavButton
            icon={History}
            label="History"
            onClick={onOpenHistory}
            isActive={isHistoryOpen}
          />
        </>
      )}
    </nav>
  );
}
