/**
 * Pure helper functions for PromptSection component
 *
 * Module-scoped utilities extracted to reduce component complexity and file size.
 * These functions are pure and have no side effects beyond their explicit parameters.
 */

import * as React from "react";

/** Safely cancels an animation frame if one is scheduled */
export function cancelScheduledRaf(rafIdRef: React.RefObject<number | null>): void {
  if (rafIdRef.current !== null) {
    cancelAnimationFrame(rafIdRef.current);
  }
}

/** Safely clears a debounce timer if one is scheduled */
export function clearScheduledDebounce(
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>
): void {
  if (timerRef.current !== null) {
    clearTimeout(timerRef.current);
  }
}

/** Creates a debounced content change notifier */
export function notifyContentChangeDebounced(
  newHasContent: boolean,
  lastHasContentRef: React.MutableRefObject<boolean>,
  debounceTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  callbackRef: React.RefObject<((hasContent: boolean) => void) | undefined>
): void {
  if (newHasContent === lastHasContentRef.current) return;

  lastHasContentRef.current = newHasContent;
  clearScheduledDebounce(debounceTimerRef);
  debounceTimerRef.current = setTimeout(() => {
    callbackRef.current?.(newHasContent);
    debounceTimerRef.current = null;
  }, 300);
}

/** Checks if the keyboard event is a submit shortcut (Ctrl/Cmd + Enter) */
export function isSubmitKeyboardShortcut(
  e: React.KeyboardEvent<HTMLTextAreaElement>
): boolean {
  return (e.ctrlKey || e.metaKey) && e.key === "Enter";
}

/** Gets the appropriate setter function based on prompt type */
export function getPromptSetterByType(
  promptType: "positive" | "negative",
  setPositive: (v: string) => void,
  setNegative: (v: string) => void
): (v: string) => void {
  return promptType === "positive" ? setPositive : setNegative;
}

/** Initializes display state if there's an initial value */
export function maybeInitializeDisplayState(
  initialValue: string,
  setCharacterCount: (n: number) => void,
  setHasContent: (b: boolean) => void,
  lastHasContentRef: React.MutableRefObject<boolean>,
  callbackRef: React.RefObject<((hasContent: boolean) => void) | undefined>
): void {
  if (!initialValue) return;
  const hasInitialContent = initialValue.length > 0;
  setCharacterCount(initialValue.length);
  setHasContent(hasInitialContent);
  lastHasContentRef.current = hasInitialContent;
  callbackRef.current?.(hasInitialContent);
}
