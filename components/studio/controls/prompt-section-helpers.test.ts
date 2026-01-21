/**
 * Tests for prompt-section-helpers.ts
 *
 * These tests verify the extracted pure utility functions
 * maintain their expected behavior after extraction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import {
  cancelScheduledRaf,
  clearScheduledDebounce,
  getPromptSetterByType,
  isSubmitKeyboardShortcut,
  maybeInitializeDisplayState,
  notifyContentChangeDebounced,
} from "./prompt-section-helpers";

describe("prompt-section-helpers", () => {
  describe("cancelScheduledRaf", () => {
    it("cancels animation frame when rafIdRef.current is not null", () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");
      const rafIdRef = { current: 123 };

      cancelScheduledRaf(rafIdRef);

      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(123);
      cancelAnimationFrameSpy.mockRestore();
    });

    it("does nothing when rafIdRef.current is null", () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");
      const rafIdRef = { current: null };

      cancelScheduledRaf(rafIdRef);

      expect(cancelAnimationFrameSpy).not.toHaveBeenCalled();
      cancelAnimationFrameSpy.mockRestore();
    });
  });

  describe("clearScheduledDebounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("clears timeout when timerRef.current is not null", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const timerId = setTimeout(() => {}, 1000);
      const timerRef = { current: timerId };

      clearScheduledDebounce(timerRef);

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
      clearTimeoutSpy.mockRestore();
    });

    it("does nothing when timerRef.current is null", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const timerRef = { current: null };

      clearScheduledDebounce(timerRef);

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe("isSubmitKeyboardShortcut", () => {
    it("returns true for Ctrl+Enter", () => {
      const event = {
        ctrlKey: true,
        metaKey: false,
        key: "Enter",
      } as React.KeyboardEvent<HTMLTextAreaElement>;

      expect(isSubmitKeyboardShortcut(event)).toBe(true);
    });

    it("returns true for Cmd+Enter (metaKey)", () => {
      const event = {
        ctrlKey: false,
        metaKey: true,
        key: "Enter",
      } as React.KeyboardEvent<HTMLTextAreaElement>;

      expect(isSubmitKeyboardShortcut(event)).toBe(true);
    });

    it("returns false for Enter without modifier", () => {
      const event = {
        ctrlKey: false,
        metaKey: false,
        key: "Enter",
      } as React.KeyboardEvent<HTMLTextAreaElement>;

      expect(isSubmitKeyboardShortcut(event)).toBe(false);
    });

    it("returns false for Ctrl+other key", () => {
      const event = {
        ctrlKey: true,
        metaKey: false,
        key: "a",
      } as React.KeyboardEvent<HTMLTextAreaElement>;

      expect(isSubmitKeyboardShortcut(event)).toBe(false);
    });
  });

  describe("getPromptSetterByType", () => {
    it("returns setPositive for 'positive' type", () => {
      const setPositive = vi.fn();
      const setNegative = vi.fn();

      const setter = getPromptSetterByType("positive", setPositive, setNegative);
      setter("test value");

      expect(setPositive).toHaveBeenCalledWith("test value");
      expect(setNegative).not.toHaveBeenCalled();
    });

    it("returns setNegative for 'negative' type", () => {
      const setPositive = vi.fn();
      const setNegative = vi.fn();

      const setter = getPromptSetterByType("negative", setPositive, setNegative);
      setter("test value");

      expect(setNegative).toHaveBeenCalledWith("test value");
      expect(setPositive).not.toHaveBeenCalled();
    });
  });

  describe("maybeInitializeDisplayState", () => {
    it("does nothing when initialValue is empty", () => {
      const setCharacterCount = vi.fn();
      const setHasContent = vi.fn();
      const lastHasContentRef = { current: false };
      const callbackRef = { current: vi.fn() };

      maybeInitializeDisplayState(
        "",
        setCharacterCount,
        setHasContent,
        lastHasContentRef,
        callbackRef
      );

      expect(setCharacterCount).not.toHaveBeenCalled();
      expect(setHasContent).not.toHaveBeenCalled();
      expect(callbackRef.current).not.toHaveBeenCalled();
    });

    it("initializes state when initialValue has content", () => {
      const setCharacterCount = vi.fn();
      const setHasContent = vi.fn();
      const lastHasContentRef = { current: false };
      const callback = vi.fn();
      const callbackRef = { current: callback };

      maybeInitializeDisplayState(
        "Hello",
        setCharacterCount,
        setHasContent,
        lastHasContentRef,
        callbackRef
      );

      expect(setCharacterCount).toHaveBeenCalledWith(5);
      expect(setHasContent).toHaveBeenCalledWith(true);
      expect(lastHasContentRef.current).toBe(true);
      expect(callback).toHaveBeenCalledWith(true);
    });

    it("handles undefined callback gracefully", () => {
      const setCharacterCount = vi.fn();
      const setHasContent = vi.fn();
      const lastHasContentRef = { current: false };
      const callbackRef = { current: undefined };

      expect(() => {
        maybeInitializeDisplayState(
          "Hello",
          setCharacterCount,
          setHasContent,
          lastHasContentRef,
          callbackRef
        );
      }).not.toThrow();

      expect(setCharacterCount).toHaveBeenCalledWith(5);
      expect(setHasContent).toHaveBeenCalledWith(true);
    });
  });

  describe("notifyContentChangeDebounced", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does nothing when hasContent has not changed", () => {
      const callback = vi.fn();
      const lastHasContentRef = { current: true };
      const debounceTimerRef = { current: null };
      const callbackRef = { current: callback };

      notifyContentChangeDebounced(true, lastHasContentRef, debounceTimerRef, callbackRef);
      vi.advanceTimersByTime(500);

      expect(callback).not.toHaveBeenCalled();
    });

    it("calls callback after debounce delay when hasContent changes", () => {
      const callback = vi.fn();
      const lastHasContentRef = { current: false };
      const debounceTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
      const callbackRef = { current: callback };

      notifyContentChangeDebounced(true, lastHasContentRef, debounceTimerRef, callbackRef);

      expect(callback).not.toHaveBeenCalled();
      expect(lastHasContentRef.current).toBe(true);

      vi.advanceTimersByTime(300);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it("clears previous timer when called again", () => {
      const callback = vi.fn();
      const lastHasContentRef = { current: false };
      const debounceTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
      const callbackRef = { current: callback };

      // First call
      notifyContentChangeDebounced(true, lastHasContentRef, debounceTimerRef, callbackRef);

      // Advance partially
      vi.advanceTimersByTime(150);

      // Reset to simulate state change
      lastHasContentRef.current = true;

      // Second call with different value
      notifyContentChangeDebounced(false, lastHasContentRef, debounceTimerRef, callbackRef);

      // Advance past first timer (should be cleared)
      vi.advanceTimersByTime(150);

      // Should not have been called yet
      expect(callback).not.toHaveBeenCalled();

      // Complete second timer
      vi.advanceTimersByTime(150);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
    });

    it("handles undefined callback gracefully", () => {
      const lastHasContentRef = { current: false };
      const debounceTimerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
      const callbackRef = { current: undefined };

      expect(() => {
        notifyContentChangeDebounced(true, lastHasContentRef, debounceTimerRef, callbackRef);
        vi.advanceTimersByTime(300);
      }).not.toThrow();
    });
  });
});
