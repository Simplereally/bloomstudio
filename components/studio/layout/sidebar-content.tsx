"use client";

/**
 * SidebarContent - Extracted sidebar scroll area with fade overlays
 *
 * This component handles the scrollable area containing prompt and controls
 * features, with smooth fade overlays at top/bottom when content overflows.
 *
 * Extracted from StudioShell for max-lines compliance.
 * ZERO logic changes - pure structural lift and shift.
 */

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Feature Components
import {
  BatchModeContext,
  ControlsFeature,
  GenerationSettingsContext,
} from "@/components/studio/features/generation";
import {
  PromptFeature,
  PromptManagerContext,
} from "@/components/studio/features/prompt";

import type { usePromptManager } from "@/hooks/use-prompt-manager";
import type { useGenerationSettings } from "@/hooks/use-generation-settings";
import type { useBatchMode } from "@/hooks/use-batch-mode";

export interface SidebarContentProps {
  /** Prompt manager hook value for PromptManagerContext */
  promptManager: ReturnType<typeof usePromptManager>;
  /** Generation settings hook value for GenerationSettingsContext */
  generationSettings: ReturnType<typeof useGenerationSettings>;
  /** Batch mode hook value for BatchModeContext */
  batchMode: ReturnType<typeof useBatchMode>;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether the model supports negative prompts */
  showNegativePrompt: boolean;
  /** Whether to show the prompt library (requires auth) */
  showLibrary: boolean;
}

/**
 * SidebarContent - Scrollable sidebar content with fade overlays
 *
 * Contains PromptFeature and ControlsFeature wrapped in their respective contexts.
 * Manages scroll state internally for fade overlay visibility.
 */
export function SidebarContent({
  promptManager,
  generationSettings,
  batchMode,
  isGenerating,
  showNegativePrompt,
  showLibrary,
}: SidebarContentProps) {
  // ========================================
  // Sidebar Scroll State (for fade overlays)
  // ========================================
  const scrollViewportRef = React.useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = React.useState(false);
  const [showBottomFade, setShowBottomFade] = React.useState(false);

  const updateScrollFades = React.useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasScrollableContent = scrollHeight > clientHeight;
    setShowTopFade(scrollTop > 8);
    setShowBottomFade(
      hasScrollableContent && scrollTop + clientHeight < scrollHeight - 8,
    );
  }, []);

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      updateScrollFades(e.currentTarget);
    },
    [updateScrollFades],
  );

  // Check initial scroll state on mount
  React.useEffect(() => {
    // Small delay to let content render
    const timer = setTimeout(() => {
      updateScrollFades(scrollViewportRef.current);
    }, 100);
    return () => clearTimeout(timer);
  }, [updateScrollFades]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      {/* Top fade overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none transition-opacity duration-200"
        style={{
          opacity: showTopFade ? 1 : 0,
          background:
            "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      />

      <ScrollArea
        className="h-full"
        onScroll={handleScroll}
        viewportRef={scrollViewportRef}
      >
        <div className="p-0 space-y-0.5 w-full min-w-0 overflow-x-hidden">
          {/* Prompt Feature */}
          <PromptManagerContext.Provider value={promptManager}>
            <PromptFeature
              isGenerating={isGenerating}
              showNegativePrompt={showNegativePrompt}
              showLibrary={showLibrary}
            />
          </PromptManagerContext.Provider>

          {/* Generation Controls Feature */}
          <GenerationSettingsContext.Provider value={generationSettings}>
            <BatchModeContext.Provider value={batchMode}>
              <ControlsFeature isGenerating={isGenerating} />
            </BatchModeContext.Provider>
          </GenerationSettingsContext.Provider>
        </div>
      </ScrollArea>

      {/* Bottom fade overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none transition-opacity duration-200"
        style={{
          opacity: showBottomFade ? 1 : 0,
          background:
            "linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 40%, transparent 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
