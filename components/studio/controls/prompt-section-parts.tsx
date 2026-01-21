"use client";

/**
 * Sub-components for PromptSection
 * Extracted to reduce complexity and file size of the main component.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EnhanceButton } from "@/components/ui/enhance-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PromptLibraryButton, SavePromptButton } from "@/components/studio/features/prompt-library";
import { ChevronDown, History, Lightbulb, Wand2, X } from "lucide-react";
import * as React from "react";

/* -----------------------------------------------------------------------------
 * ClearPromptButton
 * -------------------------------------------------------------------------- */

export interface ClearPromptButtonProps {
  visible: boolean;
  onClick: () => void;
}

/** Conditionally renders a clear button for the prompt input */
export function ClearPromptButton({ visible, onClick }: ClearPromptButtonProps) {
  if (!visible) return null;
  
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-2 top-2 h-6 w-6 opacity-50 hover:opacity-100"
      onClick={onClick}
      data-testid="clear-prompt"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * PromptHeader
 * -------------------------------------------------------------------------- */

export interface PromptHeaderProps {
  promptHistoryLength: number;
  onToggleHistory: () => void;
  characterCount: number;
  maxLength: number;
  isNearLimit: boolean;
  /** When true, the header is hidden */
  hidden?: boolean;
}

/** Renders the prompt label, history toggle, and character count */
export function PromptHeader({
  promptHistoryLength,
  onToggleHistory,
  characterCount,
  maxLength,
  isNearLimit,
  hidden = false,
}: PromptHeaderProps) {
  if (hidden) return null;

  const charCountClass = isNearLimit ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5 text-primary" />
        Prompt
      </Label>
      <div className="flex items-center gap-1">
        {promptHistoryLength > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onToggleHistory}
                data-testid="history-toggle"
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Recent prompts</TooltipContent>
          </Tooltip>
        )}
        <span className={`text-xs tabular-nums ${charCountClass}`} data-testid="character-count">
          {characterCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * PromptActionButtons
 * -------------------------------------------------------------------------- */

export interface PromptActionButtonsProps {
  showLibrary: boolean;
  hasContent: boolean;
  isGenerating: boolean;
  isEnhancing: boolean;
  promptType: "positive" | "negative";
  getContent: () => string;
  onOpenSaveLibrary: (content: string, type: "positive" | "negative") => void;
  onOpenBrowseLibrary: (type: "positive" | "negative") => void;
  onEnhance?: () => void;
  onCancelEnhance?: () => void;
}

/** Renders the action buttons (save, library, enhance) inside a prompt textarea */
export function PromptActionButtons({
  showLibrary,
  hasContent,
  isGenerating,
  isEnhancing,
  promptType,
  getContent,
  onOpenSaveLibrary,
  onOpenBrowseLibrary,
  onEnhance,
  onCancelEnhance,
}: PromptActionButtonsProps) {
  const handleSaveClick = () => {
    const content = getContent();
    if (content.trim()) {
      onOpenSaveLibrary(content, promptType);
    }
  };

  const handleBrowseClick = () => {
    onOpenBrowseLibrary(promptType);
  };

  const showEnhanceButton = onEnhance !== undefined && onCancelEnhance !== undefined;

  return (
    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
      {showLibrary && (
        <>
          <SavePromptButton
            variant="input"
            onClick={handleSaveClick}
            disabled={!hasContent || isGenerating}
            className="relative right-auto bottom-auto"
          />
          <PromptLibraryButton
            variant="input"
            onClick={handleBrowseClick}
            disabled={isGenerating}
            className="relative right-auto bottom-auto"
          />
        </>
      )}
      {showEnhanceButton && (
        <EnhanceButton
          isEnhancing={isEnhancing}
          disabled={!hasContent || isGenerating}
          onEnhance={onEnhance}
          onCancel={onCancelEnhance}
          className="relative right-auto bottom-auto"
        />
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * PromptHistoryDropdown
 * -------------------------------------------------------------------------- */

export interface PromptHistoryDropdownProps {
  promptHistory: string[];
  onSelect: (prompt: string) => void;
}

/** Renders the history dropdown list */
export function PromptHistoryDropdown({ promptHistory, onSelect }: PromptHistoryDropdownProps) {
  return (
    <div
      className="rounded-md border border-border bg-popover p-1 divide-y divide-border/50 max-w-full"
      data-testid="prompt-history"
    >
      {promptHistory.slice(0, 5).map((historyPrompt, index) => (
        <Button
          key={index}
          variant="ghost"
          className="w-full justify-start text-left text-xs h-auto py-2 px-2 rounded-none first:rounded-t last:rounded-b"
          onClick={() => onSelect(historyPrompt)}
        >
          <span className="truncate block w-full">{historyPrompt}</span>
        </Button>
      ))}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * SuggestionChips
 * -------------------------------------------------------------------------- */

export interface SuggestionChipsProps {
  suggestions: string[];
  isLoadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

/** Renders suggestion chips with lightbulb icon */
export function SuggestionChips({ suggestions, isLoadingSuggestions, onSuggestionClick }: SuggestionChipsProps) {
  const lightbulbClass = isLoadingSuggestions ? "text-yellow-400 animate-lightbulb-glow" : "text-muted-foreground";

  return (
    <div className="flex flex-wrap gap-1.5" data-testid="suggestions">
      <Lightbulb className={`h-3.5 w-3.5 mt-1 transition-all duration-300 ${lightbulbClass}`} />
      {suggestions.map((suggestion, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
          onClick={() => onSuggestionClick(suggestion)}
        >
          + {suggestion}
        </Badge>
      ))}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * NegativePromptSectionContent
 * -------------------------------------------------------------------------- */

export interface NegativePromptSectionContentProps {
  showNegative: boolean;
  onOpenChange: (open: boolean) => void;
  negativePromptRef: React.RefObject<HTMLTextAreaElement | null>;
  onInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isGenerating: boolean;
  isEnhancingNegativePrompt: boolean;
  hasContent: boolean;
  showLibrary: boolean;
  onOpenSaveLibrary: (content: string, type: "positive" | "negative") => void;
  onOpenBrowseLibrary: (type: "positive" | "negative") => void;
  onEnhanceNegativePrompt?: () => void;
  onCancelEnhanceNegativePrompt?: () => void;
}

/** Renders the collapsible negative prompt section */
export function NegativePromptSectionContent({
  showNegative,
  onOpenChange,
  negativePromptRef,
  onInput,
  isGenerating,
  isEnhancingNegativePrompt,
  hasContent,
  showLibrary,
  onOpenSaveLibrary,
  onOpenBrowseLibrary,
  onEnhanceNegativePrompt,
  onCancelEnhanceNegativePrompt,
}: NegativePromptSectionContentProps) {
  const getContent = () => negativePromptRef.current?.value ?? "";
  const chevronClass = showNegative ? "rotate-180" : "";

  return (
    <Collapsible open={showNegative} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground cursor-pointer"
          data-testid="negative-prompt-toggle"
        >
          <span className="text-xs">Negative Prompt</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${chevronClass}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
        <div className="relative w-full min-w-0">
          <Textarea
            ref={negativePromptRef}
            placeholder="What to avoid in the image..."
            defaultValue=""
            onChange={onInput}
            disabled={isGenerating || isEnhancingNegativePrompt}
            className="min-h-16 max-h-48 overflow-y-auto resize-none pb-10 bg-background/50 border-border/50 text-sm focus-visible:ring-0 focus-visible:border-primary break-words [overflow-wrap:anywhere] block w-0 min-w-full"
            data-testid="negative-prompt-input"
          />
          <PromptActionButtons
            showLibrary={showLibrary}
            hasContent={hasContent}
            isGenerating={isGenerating}
            isEnhancing={isEnhancingNegativePrompt}
            promptType="negative"
            getContent={getContent}
            onOpenSaveLibrary={onOpenSaveLibrary}
            onOpenBrowseLibrary={onOpenBrowseLibrary}
            onEnhance={onEnhanceNegativePrompt}
            onCancelEnhance={onCancelEnhanceNegativePrompt}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
