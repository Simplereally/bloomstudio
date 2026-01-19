/**
 * Tests for useKeyboardShortcuts hook
 *
 * Tests keyboard event handling for studio shortcuts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

describe("useKeyboardShortcuts", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("event listener lifecycle", () => {
    it("adds keydown event listener on mount", () => {
      renderHook(() => useKeyboardShortcuts({}));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
    });

    it("removes keydown event listener on unmount", () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts({}));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
    });

    it("updates event listener when handlers change", () => {
      const initialHandler = vi.fn();
      const newHandler = vi.fn();

      const { rerender } = renderHook(
        ({ onToggleSidebar }) => useKeyboardShortcuts({ onToggleSidebar }),
        { initialProps: { onToggleSidebar: initialHandler } }
      );

      // Initial listener added
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      // Re-render with new handler
      rerender({ onToggleSidebar: newHandler });

      // Should have removed old and added new listener
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Cmd/Ctrl + B (toggle sidebar)", () => {
    it("calls onToggleSidebar when Ctrl+B is pressed", () => {
      const onToggleSidebar = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "b",
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(onToggleSidebar).toHaveBeenCalledOnce();
    });

    it("calls onToggleSidebar when Cmd+B is pressed (Mac)", () => {
      const onToggleSidebar = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "b",
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(onToggleSidebar).toHaveBeenCalledOnce();
    });

    it("prevents default action on Ctrl+B", () => {
      const onToggleSidebar = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));

      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("does not call handler when only B is pressed (no modifier)", () => {
      const onToggleSidebar = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "b",
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(onToggleSidebar).not.toHaveBeenCalled();
    });

    it("does nothing when onToggleSidebar is not provided", () => {
      // Should not throw
      renderHook(() => useKeyboardShortcuts({}));

      expect(() => {
        act(() => {
          const event = new KeyboardEvent("keydown", {
            key: "b",
            ctrlKey: true,
            bubbles: true,
          });
          window.dispatchEvent(event);
        });
      }).not.toThrow();
    });
  });

  describe("Cmd/Ctrl + G (toggle gallery)", () => {
    it("calls onToggleGallery when Ctrl+G is pressed", () => {
      const onToggleGallery = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleGallery }));

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "g",
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(onToggleGallery).toHaveBeenCalledOnce();
    });

    it("calls onToggleGallery when Cmd+G is pressed (Mac)", () => {
      const onToggleGallery = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleGallery }));

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "g",
          metaKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(onToggleGallery).toHaveBeenCalledOnce();
    });

    it("prevents default action on Ctrl+G", () => {
      const onToggleGallery = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleGallery }));

      const event = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("does not call handler when only G is pressed (no modifier)", () => {
      const onToggleGallery = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleGallery }));

      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "g",
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      expect(onToggleGallery).not.toHaveBeenCalled();
    });
  });

  describe("multiple handlers", () => {
    it("handles both shortcuts independently", () => {
      const onToggleSidebar = vi.fn();
      const onToggleGallery = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts({ onToggleSidebar, onToggleGallery })
      );

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "b",
            ctrlKey: true,
            bubbles: true,
          })
        );
      });

      expect(onToggleSidebar).toHaveBeenCalledOnce();
      expect(onToggleGallery).not.toHaveBeenCalled();

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "g",
            ctrlKey: true,
            bubbles: true,
          })
        );
      });

      expect(onToggleSidebar).toHaveBeenCalledOnce();
      expect(onToggleGallery).toHaveBeenCalledOnce();
    });
  });

  describe("unrelated keys", () => {
    it("ignores unrelated key presses", () => {
      const onToggleSidebar = vi.fn();
      const onToggleGallery = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts({ onToggleSidebar, onToggleGallery })
      );

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "a",
            ctrlKey: true,
            bubbles: true,
          })
        );
      });

      expect(onToggleSidebar).not.toHaveBeenCalled();
      expect(onToggleGallery).not.toHaveBeenCalled();
    });

    it("ignores Shift+B", () => {
      const onToggleSidebar = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "b",
            shiftKey: true,
            bubbles: true,
          })
        );
      });

      expect(onToggleSidebar).not.toHaveBeenCalled();
    });

    it("ignores Alt+B", () => {
      const onToggleSidebar = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToggleSidebar }));

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "b",
            altKey: true,
            bubbles: true,
          })
        );
      });

      expect(onToggleSidebar).not.toHaveBeenCalled();
    });
  });
});
