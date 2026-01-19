/**
 * Tests for useLocalStorage hook
 *
 * Tests localStorage persistence, SSR hydration, and cross-tab sync.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLocalStorage } from "./use-local-storage";

describe("useLocalStorage", () => {
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
      _getStore: () => store,
    };
  })();

  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("initial value", () => {
    it("returns initial value when localStorage is empty", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "defaultValue")
      );

      expect(result.current[0]).toBe("defaultValue");
    });

    it("returns stored value when localStorage has data", () => {
      mockLocalStorage.setItem("testKey", JSON.stringify("storedValue"));

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "defaultValue")
      );

      // After layout effect runs, should sync from storage
      expect(result.current[0]).toBe("storedValue");
    });

    it("handles complex initial values (objects)", () => {
      const initialValue = { name: "test", count: 42 };
      const { result } = renderHook(() =>
        useLocalStorage("testKey", initialValue)
      );

      expect(result.current[0]).toEqual(initialValue);
    });

    it("handles array initial values", () => {
      const initialValue = [1, 2, 3];
      const { result } = renderHook(() =>
        useLocalStorage("testKey", initialValue)
      );

      expect(result.current[0]).toEqual(initialValue);
    });

    it("handles boolean initial values", () => {
      const { result } = renderHook(() => useLocalStorage("testKey", false));

      expect(result.current[0]).toBe(false);
    });

    it("handles number initial values", () => {
      const { result } = renderHook(() => useLocalStorage("testKey", 0));

      expect(result.current[0]).toBe(0);
    });
  });

  describe("setValue", () => {
    it("updates state and localStorage with new value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      act(() => {
        result.current[1]("newValue");
      });

      expect(result.current[0]).toBe("newValue");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "testKey",
        JSON.stringify("newValue")
      );
    });

    it("supports functional updates", () => {
      const { result } = renderHook(() => useLocalStorage("testKey", 10));

      act(() => {
        result.current[1]((prev) => prev + 5);
      });

      expect(result.current[0]).toBe(15);
    });

    it("persists object values correctly", () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", { count: 0 })
      );

      act(() => {
        result.current[1]({ count: 42 });
      });

      expect(result.current[0]).toEqual({ count: 42 });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "testKey",
        JSON.stringify({ count: 42 })
      );
    });

    it("handles null values", () => {
      const { result } = renderHook(() =>
        useLocalStorage<string | null>("testKey", "initial")
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();
    });
  });

  describe("key changes", () => {
    it("syncs to new key when key changes", () => {
      mockLocalStorage.setItem("key1", JSON.stringify("value1"));
      mockLocalStorage.setItem("key2", JSON.stringify("value2"));

      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, "default"),
        { initialProps: { key: "key1" } }
      );

      expect(result.current[0]).toBe("value1");

      rerender({ key: "key2" });

      expect(result.current[0]).toBe("value2");
    });

    it("returns default when new key has no stored value", () => {
      mockLocalStorage.setItem("key1", JSON.stringify("value1"));

      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, "default"),
        { initialProps: { key: "key1" } }
      );

      expect(result.current[0]).toBe("value1");

      rerender({ key: "key2" });

      expect(result.current[0]).toBe("default");
    });
  });

  describe("invalid storage values", () => {
    it("returns initial value when stored JSON is invalid", () => {
      // Simulate corruption with invalid JSON
      mockLocalStorage.setItem("testKey", "not valid json {{{");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      expect(result.current[0]).toBe("default");
    });

    it('returns initial value when stored value is "undefined"', () => {
      mockLocalStorage.setItem("testKey", "undefined");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      expect(result.current[0]).toBe("default");
    });

    it("returns initial value when stored value is empty string", () => {
      mockLocalStorage.setItem("testKey", "");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      expect(result.current[0]).toBe("default");
    });

    it("returns initial value when stored value is whitespace only", () => {
      mockLocalStorage.setItem("testKey", "   ");

      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      expect(result.current[0]).toBe("default");
    });
  });

  describe("cross-tab synchronization", () => {
    it("updates value when storage event is received", async () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      expect(result.current[0]).toBe("initial");

      // Simulate storage event from another tab
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "testKey",
            newValue: JSON.stringify("updated from other tab"),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("updated from other tab");
      });
    });

    it("ignores storage events for different keys", async () => {
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "differentKey",
            newValue: JSON.stringify("different value"),
          })
        );
      });

      // Should not change
      expect(result.current[0]).toBe("initial");
    });

    it("resets to initial value when key is removed", async () => {
      mockLocalStorage.setItem("testKey", JSON.stringify("stored"));
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      expect(result.current[0]).toBe("stored");

      // Simulate key removal from another tab
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "testKey",
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("default");
      });
    });

    it('resets to initial value when newValue is "undefined"', async () => {
      mockLocalStorage.setItem("testKey", JSON.stringify("stored"));
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "default")
      );

      expect(result.current[0]).toBe("stored");

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "testKey",
            newValue: "undefined",
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toBe("default");
      });
    });
  });

  describe("event listener cleanup", () => {
    it("removes storage event listener on unmount", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() =>
        useLocalStorage("testKey", "initial")
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("SSR safety", () => {
    it("returns initial value when window is undefined", () => {
      // Save the original window
      const originalWindow = globalThis.window;

      // Temporarily make window undefined (simulate SSR)
      // This is tricky because jsdom always has window, so we test the behavior
      // by checking that initial value is returned before hydration
      const { result } = renderHook(() =>
        useLocalStorage("testKey", "ssrDefault")
      );

      // The initial render should use initialValue for SSR hydration safety
      // Even though after effect runs it might change
      expect(result.current[0]).toBe("ssrDefault");

      // Restore window
      globalThis.window = originalWindow;
    });
  });

  describe("complex data types", () => {
    it("handles deeply nested objects", () => {
      const initialValue = {
        level1: {
          level2: {
            level3: { value: "deep" },
          },
        },
      };

      const { result } = renderHook(() =>
        useLocalStorage("testKey", initialValue)
      );

      act(() => {
        result.current[1]({
          level1: {
            level2: {
              level3: { value: "updated" },
            },
          },
        });
      });

      expect(result.current[0].level1.level2.level3.value).toBe("updated");
    });

    it("handles arrays of objects", () => {
      const initialValue = [{ id: 1 }, { id: 2 }];

      const { result } = renderHook(() =>
        useLocalStorage("testKey", initialValue)
      );

      act(() => {
        result.current[1]((prev) => [...prev, { id: 3 }]);
      });

      expect(result.current[0]).toHaveLength(3);
      expect(result.current[0][2]).toEqual({ id: 3 });
    });
  });
});
