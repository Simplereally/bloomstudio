"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Use useLayoutEffect on client, useEffect on server (to avoid SSR warnings)
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A hook that persists state to localStorage.
 *
 * This implementation:
 * - Initializes with initialValue during SSR to avoid hydration mismatch
 * - Uses useLayoutEffect to sync from localStorage before browser paint (no flicker)
 * - Subscribes to storage events for cross-tab synchronization
 * - Properly handles key changes
 *
 * @param key The localStorage key
 * @param initialValue The initial value if no value is found in localStorage
 * @returns [storedValue, setValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  // Always initialize with initialValue for SSR hydration safety
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Track the current key and whether we've done initial sync
  const keyRef = useRef(key);
  const initialSyncDoneRef = useRef(false);

  // Helper to read from localStorage
  const readFromStorage = useCallback(
    (storageKey: string): T => {
      if (typeof window === "undefined") {
        return initialValue;
      }

      try {
        const item = window.localStorage.getItem(storageKey);
        // Check for null, undefined value, "undefined" string, and empty strings
        if (
          item !== null &&
          item !== undefined &&
          item !== "undefined" &&
          item.trim() !== ""
        ) {
          return JSON.parse(item) as T;
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${storageKey}":`, error);
      }
      return initialValue;
    },
    [initialValue],
  );

  // Sync from localStorage immediately after hydration (before paint)
  // This runs synchronously before the browser paints, eliminating flicker
  useIsomorphicLayoutEffect(() => {
    // Handle initial sync or key change
    if (!initialSyncDoneRef.current || keyRef.current !== key) {
      keyRef.current = key;
      initialSyncDoneRef.current = true;

      const valueFromStorage = readFromStorage(key);

      // Only update if the value is different to avoid unnecessary re-renders
      setStoredValue((current) => {
        // Deep equality check for objects
        if (JSON.stringify(current) === JSON.stringify(valueFromStorage)) {
          return current;
        }
        return valueFromStorage;
      });
    }
  }, [key, readFromStorage]);

  // Subscribe to storage events from other tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        if (e.newValue !== null && e.newValue !== "undefined") {
          try {
            const parsed = JSON.parse(e.newValue) as T;
            setStoredValue(parsed);
          } catch (error) {
            console.warn(
              `Error parsing storage event for key "${key}":`,
              error,
            );
          }
        } else {
          // Key was removed or set to null
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue]);

  // Setter function that updates both state and localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;

          // Save to localStorage
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  return [storedValue, setValue];
}
