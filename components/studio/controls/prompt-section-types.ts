/**
 * Type definitions for PromptSection component
 *
 * Extracted to reduce main component file size while maintaining
 * backward compatibility through re-exports.
 */

import * as React from "react";

export interface PromptSectionProps {
  /** Maximum character limit for prompt */
  maxLength?: number;
  /** Whether generation is in progress */
  isGenerating?: boolean;
  /** Whether to show the negative prompt section (model-dependent) */
  showNegativePrompt?: boolean;
  /** Recent prompts for history */
  promptHistory?: string[];
  /** Callback when a history item is selected */
  onSelectHistory?: (prompt: string) => void;
  /** Enhancement suggestions */
  suggestions?: string[];
  /** Whether AI suggestions are being loaded */
  isLoadingSuggestions?: boolean;
  /** Callback when a suggestion is clicked */
  onAddSuggestion?: (suggestion: string) => void;
  /** Whether the main prompt is being enhanced */
  isEnhancingPrompt?: boolean;
  /** Callback to trigger prompt enhancement */
  onEnhancePrompt?: () => void;
  /** Callback to cancel prompt enhancement */
  onCancelEnhancePrompt?: () => void;
  /** Whether the negative prompt is being enhanced */
  isEnhancingNegativePrompt?: boolean;
  /** Callback to trigger negative prompt enhancement */
  onEnhanceNegativePrompt?: () => void;
  /** Callback to cancel negative prompt enhancement */
  onCancelEnhanceNegativePrompt?: () => void;
  /** Callback when prompt content changes (for enabling/disabling generate button) */
  onContentChange?: (hasContent: boolean) => void;
  /** Additional class names */
  className?: string;
  /** Ref to expose prompt reading functions to parent */
  apiRef?: React.RefObject<PromptSectionAPI | null>;
  /** Hide the header label (when wrapped in CollapsibleSection) */
  hideHeader?: boolean;
  /** Whether to show prompt library features (requires auth) */
  showLibrary?: boolean;
}

export interface PromptSectionAPI {
  getPrompt: () => string;
  getNegativePrompt: () => string;
  setPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  focusPrompt: () => void;
  /** Get current character count */
  getCharacterCount: () => number;
  /** Get maximum character length */
  getMaxLength: () => number;
  /** Check if history is currently open */
  isHistoryOpen: () => boolean;
  /** Toggle history visibility */
  toggleHistory: () => void;
}
