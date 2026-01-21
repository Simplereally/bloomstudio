"use client";

/**
 * SidebarGenerateButton - Extracted generate/batch button section
 *
 * This component handles the bottom action bar of the sidebar containing
 * the generate button, batch action controls, and batch config.
 *
 * Extracted from StudioShell for max-lines compliance.
 * ZERO logic changes - pure structural lift and shift.
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BatchActionButton } from "@/components/studio/batch/batch-action-button";
import { BatchConfigButton } from "@/components/studio/batch/batch-config-button";
import type { BatchModeSettings } from "@/components/studio/batch/batch-mode-panel";

export interface SidebarGenerateButtonProps {
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether the prompt has content (enables generate button) */
  hasPromptContent: boolean;
  /** Handler for generate button click */
  onGenerateClick: () => void;
  /** Whether batch mode is currently active */
  isBatchActive: boolean;
  /** Whether batch is paused */
  isBatchPaused: boolean;
  /** Batch progress info */
  batchProgress: {
    completedCount: number;
    totalCount: number;
    inFlightCount: number;
  };
  /** Batch settings */
  batchSettings: BatchModeSettings;
  /** Handler for batch settings change */
  onBatchSettingsChange: (settings: BatchModeSettings) => void;
  /** Handler for pause batch */
  onPauseBatch: () => void;
  /** Handler for resume batch */
  onResumeBatch: () => void;
  /** Handler for cancel batch */
  onCancelBatch: () => void;
  /** Whether on mobile device */
  isMobile: boolean;
}

/**
 * SidebarGenerateButton - Generate/Batch action button section
 *
 * Shows either:
 * - BatchActionButton when batch is active (pause/resume/cancel)
 * - Generate button + BatchConfigButton when idle
 */
export function SidebarGenerateButton({
  isGenerating,
  hasPromptContent,
  onGenerateClick,
  isBatchActive,
  isBatchPaused,
  batchProgress,
  batchSettings,
  onBatchSettingsChange,
  onPauseBatch,
  onResumeBatch,
  onCancelBatch,
  isMobile,
}: SidebarGenerateButtonProps) {
  return (
    <div className="p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] border-t bg-background/60">
      {isBatchActive ? (
        <BatchActionButton
          isPaused={isBatchPaused}
          completedCount={batchProgress.completedCount}
          totalCount={batchProgress.totalCount}
          inFlightCount={batchProgress.inFlightCount}
          onPause={onPauseBatch}
          onResume={onResumeBatch}
          onCancel={onCancelBatch}
        />
      ) : (
        <div className="flex items-center gap-1.5 w-full">
          <Button
            onClick={onGenerateClick}
            disabled={isGenerating || !hasPromptContent}
            className="flex-1 h-11 text-base font-semibold"
            size="lg"
          >
            {isGenerating ? (
              "Generating..."
            ) : batchSettings.enabled ? (
              <>Generate Batch ({batchSettings.count})</>
            ) : (
              <>Generate Image</>
            )}
          </Button>

          {isMobile && (
            <Separator
              orientation="vertical"
              className="h-8 bg-border/40 mx-0.5"
            />
          )}

          <BatchConfigButton
            settings={batchSettings}
            onSettingsChange={onBatchSettingsChange}
            disabled={isGenerating || isBatchActive}
            className={isMobile ? "w-14" : undefined}
          />
        </div>
      )}
    </div>
  );
}
