"use client";

/**
 * PromptSection - Self-contained prompt input section
 *
 * This component manages its own state internally to prevent re-render cascades.
 * It uses uncontrolled inputs for maximum typing performance.
 *
 * Design:
 * - Uncontrolled inputs (uses defaultValue, not value)
 * - Local state only for UI elements (character count)
 * - Refs for reading values on-demand
 * - Parent only needs to care about values at submission time
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EnhanceButton } from "@/components/ui/enhance-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PromptLibrary, PromptLibraryButton, SavePromptButton } from "@/components/studio/features/prompt-library";
import { ChevronDown, History, Lightbulb, Wand2, X } from "lucide-react";
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

export function PromptSection({
  maxLength = 2000,
  isGenerating = false,
  showNegativePrompt = true,
  promptHistory = [],
  onSelectHistory,
  suggestions = [],
  isLoadingSuggestions = false,
  onAddSuggestion,
  isEnhancingPrompt = false,
  onEnhancePrompt,
  onCancelEnhancePrompt,
  isEnhancingNegativePrompt = false,
  onEnhanceNegativePrompt,
  onCancelEnhanceNegativePrompt,
  onContentChange,
  className,
  apiRef,
  hideHeader = false,
  showLibrary = false,
}: PromptSectionProps) {
  // UI-only state (doesn't affect parent)
  const [showNegative, setShowNegative] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [characterCount, setCharacterCount] = React.useState(0);

  // Prompt library modal state
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [libraryPromptType, setLibraryPromptType] = React.useState<"positive" | "negative">("positive");
  const [saveContent, setSaveContent] = React.useState<string | undefined>(undefined);
  const [hasContent, setHasContent] = React.useState(false);

  // Refs for uncontrolled inputs
  const promptRef = React.useRef<HTMLTextAreaElement>(null);
  const negativePromptRef = React.useRef<HTMLTextAreaElement>(null);

  // Debounce timer ref for parent notification
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced parent notification (300ms) - reduces re-renders of generate button
  const notifyParentDebounced = React.useCallback(
    (newHasContent: boolean) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onContentChange?.(newHasContent);
      }, 300);
    },
    [onContentChange]
  );

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Notify initial content status on mount
  React.useEffect(() => {
    const initialValue = promptRef.current?.value ?? "";
    onContentChange?.(initialValue.length > 0);
  }, [onContentChange]); // Run once on mount or when onContentChange changes

  // Immediate update for local UI, debounced for parent
  const updateContentState = React.useCallback(
    (newHasContent: boolean, length: number) => {
      setCharacterCount(length);
      setHasContent(newHasContent);
      notifyParentDebounced(newHasContent);
    },
    [notifyParentDebounced]
  );

  // Immediate parent notification (for non-typing actions like history select, clear)
  const updateContentStateImmediate = React.useCallback(
    (newHasContent: boolean, length: number) => {
      setCharacterCount(length);
      setHasContent(newHasContent);
      // Clear any pending debounce and notify immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onContentChange?.(newHasContent);
    },
    [onContentChange]
  );

  // API exposed to parent via ref
  React.useImperativeHandle(
    apiRef,
    () => ({
      getPrompt: () => promptRef.current?.value ?? "",
      getNegativePrompt: () => negativePromptRef.current?.value ?? "",
      setPrompt: (value: string) => {
        if (promptRef.current) {
          promptRef.current.value = value;
          updateContentStateImmediate(value.length > 0, value.length);
        }
      },
      setNegativePrompt: (value: string) => {
        if (negativePromptRef.current) {
          negativePromptRef.current.value = value;
        }
      },
      focusPrompt: () => promptRef.current?.focus(),
      getCharacterCount: () => characterCount,
      getMaxLength: () => maxLength,
      isHistoryOpen: () => showHistory,
      toggleHistory: () => setShowHistory((prev) => !prev),
    }),
    [updateContentStateImmediate, characterCount, maxLength, showHistory]
  );

  const isNearLimit = characterCount > maxLength * 0.9;

  // Handle input changes - update local UI state immediately, notify parent debounced
  const handlePromptInput = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      updateContentState(value.length > 0, value.length);
    },
    [updateContentState]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      // Parent should handle submission via keyboard event listener
    }
  };

  const clearPrompt = () => {
    if (promptRef.current) {
      promptRef.current.value = "";
      updateContentStateImmediate(false, 0);
      promptRef.current.focus();
    }
  };

  const handleHistorySelect = (historyPrompt: string) => {
    if (promptRef.current) {
      promptRef.current.value = historyPrompt;
      updateContentStateImmediate(historyPrompt.length > 0, historyPrompt.length);
    }
    onSelectHistory?.(historyPrompt);
    setShowHistory(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (promptRef.current) {
      const current = promptRef.current.value;
      const newValue = `${current} ${suggestion}`.trim();
      promptRef.current.value = newValue;
      updateContentStateImmediate(newValue.length > 0, newValue.length);
    }
    onAddSuggestion?.(suggestion);
  };

  return (
    <div className={`space-y-3 w-full min-w-0 ${className || ""}`} data-testid="prompt-section">
      {/* Main Prompt */}
      <div className="space-y-2 w-full min-w-0">
        {!hideHeader && (
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              Prompt
            </Label>
            <div className="flex items-center gap-1">
              {promptHistory.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowHistory(!showHistory)}
                      data-testid="history-toggle"
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Recent prompts</TooltipContent>
                </Tooltip>
              )}
              <span
                className={`text-xs tabular-nums ${isNearLimit ? "text-destructive" : "text-muted-foreground"}`}
                data-testid="character-count"
              >
                {characterCount}/{maxLength}
              </span>
            </div>
          </div>
        )}

        <div className="relative w-full min-w-0">
          <Textarea
            ref={promptRef}
            id="prompt"
            placeholder="Describe the image you want to create..."
            defaultValue=""
            onChange={handlePromptInput}
            onKeyDown={handleKeyDown}
            disabled={isGenerating || isEnhancingPrompt}
            maxLength={maxLength}
            className="min-h-24 max-h-[360px] overflow-y-auto resize-none pr-8 pb-10 bg-background/50 border-border/50 focus-visible:ring-0 focus-visible:border-primary transition-all duration-200 break-words [overflow-wrap:anywhere] block w-0 min-w-full"
            data-testid="prompt-input"
          />
          {hasContent && !isGenerating && !isEnhancingPrompt && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 opacity-50 hover:opacity-100"
              onClick={clearPrompt}
              data-testid="clear-prompt"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {/* Bottom action buttons row */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
            {showLibrary && (
              <>
                <SavePromptButton
                  variant="input"
                  onClick={() => {
                    const content = promptRef.current?.value ?? "";
                    if (content.trim()) {
                      setSaveContent(content);
                      setLibraryPromptType("positive");
                      setLibraryOpen(true);
                    }
                  }}
                  disabled={!hasContent || isGenerating}
                  className="relative right-auto bottom-auto"
                />
                <PromptLibraryButton
                  variant="input"
                  onClick={() => {
                    setSaveContent(undefined);
                    setLibraryPromptType("positive");
                    setLibraryOpen(true);
                  }}
                  disabled={isGenerating}
                  className="relative right-auto bottom-auto"
                />
              </>
            )}
            {onEnhancePrompt && onCancelEnhancePrompt && (
              <EnhanceButton
                isEnhancing={isEnhancingPrompt}
                disabled={!hasContent || isGenerating}
                onEnhance={onEnhancePrompt}
                onCancel={onCancelEnhancePrompt}
                className="relative right-auto bottom-auto"
              />
            )}
          </div>
        </div>

        {/* Prompt History Dropdown */}
        {showHistory && promptHistory.length > 0 && (
          <div className="rounded-md border border-border bg-popover p-1 divide-y divide-border/50 max-w-full" data-testid="prompt-history">
            {promptHistory.slice(0, 5).map((historyPrompt, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left text-xs h-auto py-2 px-2 rounded-none first:rounded-t last:rounded-b"
                onClick={() => handleHistorySelect(historyPrompt)}
              >
                <span className="truncate block w-full">{historyPrompt}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5" data-testid="suggestions">
            <Lightbulb
              className={`h-3.5 w-3.5 mt-1 transition-all duration-300 ${
                isLoadingSuggestions ? "text-yellow-400 animate-lightbulb-glow" : "text-muted-foreground"
              }`}
            />
            {suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                + {suggestion}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Negative Prompt (Collapsible) - Only shown for models that support it */}
      {showNegativePrompt && (
        <Collapsible open={showNegative} onOpenChange={setShowNegative}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              data-testid="negative-prompt-toggle"
            >
              <span className="text-xs">Negative Prompt</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNegative ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="relative w-full min-w-0">
              <Textarea
                ref={negativePromptRef}
                placeholder="What to avoid in the image..."
                defaultValue=""
                disabled={isGenerating || isEnhancingNegativePrompt}
                className="min-h-16 resize-none pb-10 bg-background/50 border-border/50 text-sm focus-visible:ring-0 focus-visible:border-primary break-words [overflow-wrap:anywhere] block w-0 min-w-full"
                data-testid="negative-prompt-input"
              />
              {/* Bottom action buttons row for negative prompt */}
              <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                {showLibrary && (
                  <>
                    <SavePromptButton
                      variant="input"
                      onClick={() => {
                        const content = negativePromptRef.current?.value ?? "";
                        if (content.trim()) {
                          setSaveContent(content);
                          setLibraryPromptType("negative");
                          setLibraryOpen(true);
                        }
                      }}
                      disabled={isGenerating}
                      className="relative right-auto bottom-auto"
                    />
                    <PromptLibraryButton
                      variant="input"
                      onClick={() => {
                        setSaveContent(undefined);
                        setLibraryPromptType("negative");
                        setLibraryOpen(true);
                      }}
                      disabled={isGenerating}
                      className="relative right-auto bottom-auto"
                    />
                  </>
                )}
                {onEnhanceNegativePrompt && onCancelEnhanceNegativePrompt && (
                  <EnhanceButton
                    isEnhancing={isEnhancingNegativePrompt}
                    disabled={!hasContent || isGenerating}
                    onEnhance={onEnhanceNegativePrompt}
                    onCancel={onCancelEnhanceNegativePrompt}
                    className="relative right-auto bottom-auto"
                  />
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Prompt Library Modal */}
      {showLibrary && (
        <PromptLibrary
          isOpen={libraryOpen}
          onClose={() => {
            setLibraryOpen(false);
            setSaveContent(undefined);
          }}
          promptType={libraryPromptType}
          onInsert={(content) => {
            if (libraryPromptType === "positive") {
              if (promptRef.current) {
                promptRef.current.value = content;
                updateContentStateImmediate(content.length > 0, content.length);
              }
            } else {
              if (negativePromptRef.current) {
                negativePromptRef.current.value = content;
              }
            }
          }}
          initialSaveContent={saveContent}
        />
      )}
    </div>
  );
}
