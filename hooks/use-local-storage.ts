"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * A hook that persists state to localStorage.
 * Handles hydration by initializing with initialValue and syncing in useEffect.
 * 
 * @param key The localStorage key
 * @param initialValue The initial value if no value is found in localStorage
 * @returns [storedValue, setValue]
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    // Initialize with initialValue exactly as provided to avoid hydration mismatch
    const [storedValue, setStoredValue] = useState<T>(initialValue)

    // Use refs to avoid unnecessary re-renders when these change
    const initialValueRef = useRef(initialValue)
    useEffect(() => {
        initialValueRef.current = initialValue
    }, [initialValue])

    // Load from local storage on mount or key change
    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const item = window.localStorage.getItem(key)
            if (item) {
                const parsed = JSON.parse(item) as T
                
                // Only update state if the value is different from current state
                // This prevents the "Maximum update depth exceeded" loop when 
                // initialValue is a literal object that changes reference on every render.
                // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentionally syncing from localStorage to avoid hydration mismatch
                setStoredValue((current) => {
                    // Simple stringify comparison for deep equality check
                    // Enough for filter states and small settings objects
                    if (JSON.stringify(current) === item) {
                        return current
                    }
                    return parsed
                })
            } else {
                setStoredValue(initialValueRef.current)
            }
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error)
        }
        // ONLY re-run on key changes
        // initialValue is handled via ref to avoid dependency loops
    }, [key])

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Get the value to store
            // We use a temporary variable because we can't reliably read storedValue 
            // from the closure if multiple updates happen quickly (though usually fine in UI)
            setStoredValue((prev) => {
                const valueToStore = value instanceof Function ? value(prev) : value
                
                // Save to local storage
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore))
                }
                
                return valueToStore
            })
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error)
        }
    }, [key])

    return [storedValue, setValue]
}
