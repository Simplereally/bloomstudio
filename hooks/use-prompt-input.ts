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
}

/**
 * Hook for managing prompt input state without causing parent re-renders.
 * 
 * Uses uncontrolled inputs with refs for maximum performance.
 * Parent components can read values on-demand via getPrompt()/getNegativePrompt().
 */
export function usePromptInput(): UsePromptInputReturn {
    const promptRef = React.useRef<HTMLTextAreaElement>(null)
    const negativePromptRef = React.useRef<HTMLTextAreaElement>(null)
    
    // Store values in refs to avoid re-renders
    const promptValueRef = React.useRef("")
    const negativePromptValueRef = React.useRef("")
    
    // Subscribers for components that need to react to changes
    const promptSubscribers = React.useRef<Set<(value: string) => void>>(new Set())

    const getPrompt = React.useCallback(() => {
        // Prefer DOM value if available, fall back to ref
        return promptRef.current?.value ?? promptValueRef.current
    }, [])

    const setPrompt = React.useCallback((value: string) => {
        promptValueRef.current = value
        if (promptRef.current) {
            promptRef.current.value = value
        }
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
    }, [])

    const subscribeToPrompt = React.useCallback((callback: (value: string) => void) => {
        promptSubscribers.current.add(callback)
        return () => {
            promptSubscribers.current.delete(callback)
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
    }
}
