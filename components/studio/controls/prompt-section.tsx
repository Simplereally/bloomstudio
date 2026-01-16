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
import { usePromptInput } from "@/hooks/use-prompt-input";
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
  // Use hook for prompt input refs and value management
  const {
    promptRef,
    negativePromptRef,
    getPrompt,
    setPrompt,
    getNegativePrompt,
    setNegativePrompt,
    subscribeToPrompt,
    subscribeToNegativePrompt,
  } = usePromptInput();

  // UI-only state (doesn't affect parent)
  const [showNegative, setShowNegative] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // Display state - updated via RAF batching to prevent lag
  const [characterCount, setCharacterCount] = React.useState(0);
  const [hasContent, setHasContent] = React.useState(false);
  const isNearLimit = characterCount > maxLength * 0.9;

  // Prompt library modal state
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [libraryPromptType, setLibraryPromptType] = React.useState<"positive" | "negative">("positive");
  const [saveContent, setSaveContent] = React.useState<string | undefined>(undefined);

  // Refs for RAF batching and debouncing
  const rafIdRef = React.useRef<number | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHasContentRef = React.useRef(false);
  const onContentChangeRef = React.useRef(onContentChange);

  // Keep callback ref updated
  React.useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Subscribe to prompt changes for character count updates
  React.useEffect(() => {
    const updateDisplay = (value: string) => {
      const length = value.length;
      const newHasContent = length > 0;

      // RAF-batch display state updates
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setCharacterCount(length);
        setHasContent(newHasContent);
        rafIdRef.current = null;
      });

      // Debounce parent notification if hasContent changed
      if (newHasContent !== lastHasContentRef.current) {
        lastHasContentRef.current = newHasContent;
        if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          onContentChangeRef.current?.(newHasContent);
          debounceTimerRef.current = null;
        }, 300);
      }
    };

    const unsubscribe = subscribeToPrompt(updateDisplay);

    // Initialize with current value
    const initialValue = getPrompt();
    if (initialValue) {
      setCharacterCount(initialValue.length);
      setHasContent(initialValue.length > 0);
      lastHasContentRef.current = initialValue.length > 0;
      onContentChangeRef.current?.(initialValue.length > 0);
    }

    return unsubscribe;
  }, [subscribeToPrompt, getPrompt]);

  // Subscribe to negative prompt changes (no display state needed, just RAF-batch any UI updates if added later)
  React.useEffect(() => {
    // Currently no UI display for negative prompt character count, 
    // but subscription ensures setNegativePrompt flows through hook properly
    const unsubscribe = subscribeToNegativePrompt(() => {
      // Could add negative prompt character count here if needed
    });
    return unsubscribe;
  }, [subscribeToNegativePrompt]);

  // Handle input changes - call setPrompt which notifies subscribers
  const handlePromptInput = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    },
    [setPrompt]
  );

  // Handle negative prompt input changes - call setNegativePrompt which notifies subscribers
  const handleNegativePromptInput = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNegativePrompt(e.target.value);
    },
    [setNegativePrompt]
  );

  // Clear prompt
  const clearPrompt = React.useCallback(() => {
    setPrompt("");
    promptRef.current?.focus();
  }, [setPrompt, promptRef]);

  // Focus prompt
  const focusPrompt = React.useCallback(() => {
    promptRef.current?.focus();
  }, [promptRef]);

  // API exposed to parent via ref
  React.useImperativeHandle(
    apiRef,
    () => ({
      getPrompt,
      getNegativePrompt,
      setPrompt,
      setNegativePrompt,
      focusPrompt,
      getCharacterCount: () => characterCount,
      getMaxLength: () => maxLength,
      isHistoryOpen: () => showHistory,
      toggleHistory: () => setShowHistory((prev) => !prev),
    }),
    [getPrompt, getNegativePrompt, setPrompt, setNegativePrompt, focusPrompt, characterCount, maxLength, showHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      // Parent should handle submission via keyboard event listener
    }
  };

  const handleHistorySelect = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    onSelectHistory?.(historyPrompt);
    setShowHistory(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const current = getPrompt();
    const newValue = `${current} ${suggestion}`.trim();
    setPrompt(newValue);
    onAddSuggestion?.(suggestion);
  };

  return (
    <div className={`space-y-1.5 w-full min-w-0 ${className || ""}`} data-testid="prompt-section">
      {/* Main Prompt */}
      <div className="space-y-1 w-full min-w-0">
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
            className="min-h-24 max-h-48 overflow-y-auto resize-none px-2 pr-8 pb-10 bg-background/50 border-border/50 focus-visible:ring-0 focus-visible:border-primary transition-all duration-200 break-words [overflow-wrap:anywhere] block w-0 min-w-full"
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
              className={`h-3.5 w-3.5 mt-1 transition-all duration-300 ${isLoadingSuggestions ? "text-yellow-400 animate-lightbulb-glow" : "text-muted-foreground"
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
              className="w-full justify-between text-muted-foreground hover:text-foreground cursor-pointer"
              data-testid="negative-prompt-toggle"
            >
              <span className="text-xs">Negative Prompt</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNegative ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
            <div className="relative w-full min-w-0">
              <Textarea
                ref={negativePromptRef}
                placeholder="What to avoid in the image..."
                defaultValue=""
                onChange={handleNegativePromptInput}
                disabled={isGenerating || isEnhancingNegativePrompt}
                className="min-h-16 max-h-48 overflow-y-auto resize-none pb-10 bg-background/50 border-border/50 text-sm focus-visible:ring-0 focus-visible:border-primary break-words [overflow-wrap:anywhere] block w-0 min-w-full"
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
              setPrompt(content);
            } else {
              setNegativePrompt(content);
            }
          }}
          initialSaveContent={saveContent}
        />
      )}
    </div>
  );
}
