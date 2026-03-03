"use client"

/**
 * usePromptInput Hook
 * 
 * Manages prompt input state using uncontrolled pattern with ref forwarding.
 * This hook isolates prompt state from parent components to prevent re-render cascades.
 * 
 * Key design decisions:
 * - Uses refs to store current values, avoiding state-based re-renders
 * - Exposes getValue() functions for reading current values on-demand
 * - Parent components only care about values at submission time
 */

import * as React from "react"

export interface UsePromptInputReturn {
    /** Current prompt value (read from ref) */
    getPrompt: () => string
    /** Set the prompt value (updates ref and optional DOM element) */
    setPrompt: (value: string) => void
    /** Current negative prompt value */
    getNegativePrompt: () => string
    /** Set the negative prompt value */
    setNegativePrompt: (value: string) => void
    /** Ref for the prompt textarea element */
    promptRef: React.RefObject<HTMLTextAreaElement | null>
    /** Ref for the negative prompt textarea element */
    negativePromptRef: React.RefObject<HTMLTextAreaElement | null>
    /** Subscribe to prompt changes (for character count, etc.) */
    subscribeToPrompt: (callback: (value: string) => void) => () => void
    /** Subscribe to negative prompt changes */
    subscribeToNegativePrompt: (callback: (value: string) => void) => () => void
}

// localStorage keys for prompt persistence
const PROMPT_STORAGE_KEY = "ps:prompt:main"
const NEGATIVE_PROMPT_STORAGE_KEY = "ps:prompt:negative"

/**
 * Read a string from localStorage, returning fallback on any failure.
 */
function readStorageString(key: string, fallback: string): string {
    if (typeof window === "undefined") return fallback
    try {
        const item = window.localStorage.getItem(key)
        if (item !== null && item !== "undefined" && item.trim() !== "") {
            return JSON.parse(item) as string
        }
    } catch {
        // Corrupted or non-JSON value — ignore and use fallback
    }
    return fallback
}

/**
 * Write a string to localStorage.
 */
function writeStorageString(key: string, value: string): void {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Storage full or access denied — silently degrade
    }
}

/**
 * Hook for managing prompt input state without causing parent re-renders.
 * 
 * Uses uncontrolled inputs with refs for maximum performance.
 * Parent components can read values on-demand via getPrompt()/getNegativePrompt().
 * 
 * Persists prompt and negative prompt text to localStorage so values survive
 * page reloads. Because this hook uses an uncontrolled pattern (refs, not state),
 * we integrate with localStorage directly rather than via useLocalStorage.
 * Writes are debounced (500ms) to avoid thrashing localStorage on every keystroke.
 */
export function usePromptInput(): UsePromptInputReturn {
    const promptRef = React.useRef<HTMLTextAreaElement>(null)
    const negativePromptRef = React.useRef<HTMLTextAreaElement>(null)

    // Store values in refs to avoid re-renders.
    // Initialize from localStorage so the value is available before DOM mount.
    const promptValueRef = React.useRef(readStorageString(PROMPT_STORAGE_KEY, ""))
    const negativePromptValueRef = React.useRef(readStorageString(NEGATIVE_PROMPT_STORAGE_KEY, ""))

    // Debounce timers for localStorage writes
    const promptSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const negativeSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    // Subscribers for components that need to react to changes
    const promptSubscribers = React.useRef<Set<(value: string) => void>>(new Set())
    const negativePromptSubscribers = React.useRef<Set<(value: string) => void>>(new Set())

    // Hydrate DOM elements from persisted values once they mount.
    // useLayoutEffect runs before paint, so the user never sees an empty field flash.
    React.useLayoutEffect(() => {
        if (promptRef.current && promptValueRef.current) {
            promptRef.current.value = promptValueRef.current
        }
        if (negativePromptRef.current && negativePromptValueRef.current) {
            negativePromptRef.current.value = negativePromptValueRef.current
        }
    }, [])

    // Flush any pending localStorage writes and clean up timers on unmount
    React.useEffect(() => {
        return () => {
            if (promptSaveTimerRef.current !== null) {
                clearTimeout(promptSaveTimerRef.current)
                // Flush the current ref value to storage before unmount
                writeStorageString(PROMPT_STORAGE_KEY, promptValueRef.current)
            }
            if (negativeSaveTimerRef.current !== null) {
                clearTimeout(negativeSaveTimerRef.current)
                writeStorageString(NEGATIVE_PROMPT_STORAGE_KEY, negativePromptValueRef.current)
            }
        }
    }, [])

    const getPrompt = React.useCallback(() => {
        // Prefer DOM value if available, fall back to ref
        return promptRef.current?.value ?? promptValueRef.current
    }, [])

    const setPrompt = React.useCallback((value: string) => {
        promptValueRef.current = value
        if (promptRef.current) {
            promptRef.current.value = value
        }
        // Debounced persist to localStorage (500ms)
        if (promptSaveTimerRef.current !== null) clearTimeout(promptSaveTimerRef.current)
        promptSaveTimerRef.current = setTimeout(() => {
            writeStorageString(PROMPT_STORAGE_KEY, promptValueRef.current)
            promptSaveTimerRef.current = null
        }, 500)
        // Notify subscribers
        promptSubscribers.current.forEach(cb => cb(value))
    }, [])

    const getNegativePrompt = React.useCallback(() => {
        return negativePromptRef.current?.value ?? negativePromptValueRef.current
    }, [])

    const setNegativePrompt = React.useCallback((value: string) => {
        negativePromptValueRef.current = value
        if (negativePromptRef.current) {
            negativePromptRef.current.value = value
        }
        // Debounced persist to localStorage (500ms)
        if (negativeSaveTimerRef.current !== null) clearTimeout(negativeSaveTimerRef.current)
        negativeSaveTimerRef.current = setTimeout(() => {
            writeStorageString(NEGATIVE_PROMPT_STORAGE_KEY, negativePromptValueRef.current)
            negativeSaveTimerRef.current = null
        }, 500)
        // Notify subscribers
        negativePromptSubscribers.current.forEach(cb => cb(value))
    }, [])

    const subscribeToPrompt = React.useCallback((callback: (value: string) => void) => {
        promptSubscribers.current.add(callback)
        return () => {
            promptSubscribers.current.delete(callback)
        }
    }, [])

    const subscribeToNegativePrompt = React.useCallback((callback: (value: string) => void) => {
        negativePromptSubscribers.current.add(callback)
        return () => {
            negativePromptSubscribers.current.delete(callback)
        }
    }, [])

    return {
        getPrompt,
        setPrompt,
        getNegativePrompt,
        setNegativePrompt,
        promptRef,
        negativePromptRef,
        subscribeToPrompt,
        subscribeToNegativePrompt,
    }
}
