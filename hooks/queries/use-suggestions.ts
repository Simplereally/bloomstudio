"use client"

/**
 * useSuggestions Hook
 *
 * Hook for generating contextual prompt suggestions with debouncing.
 * Fetches 3 AI-generated phrase suggestions based on the current prompt.
 */

import { useCallback, useEffect, useRef, useState } from "react"

const DEFAULT_SUGGESTIONS = ["cinematic lighting", "8k ultra HD", "detailed"]
const DEBOUNCE_MS = 400
const MIN_PROMPT_LENGTH = 3

interface SuggestionsSuccessResponse {
  success: true
  data: {
    suggestions: string[]
  }
}

interface SuggestionsErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

type SuggestionsResponse = SuggestionsSuccessResponse | SuggestionsErrorResponse

/**
 * Options for the useSuggestions hook
 */
export interface UseSuggestionsOptions {
  /** Override the default debounce delay (ms) */
  debounceMs?: number
  /** Minimum prompt length to trigger suggestions */
  minLength?: number
}

/**
 * Return type for useSuggestions hook
 */
export interface UseSuggestionsReturn {
  /** Current suggestions (either generated or default) */
  suggestions: string[]
  /** Whether suggestions are being fetched */
  isLoading: boolean
  /** Trigger suggestion fetch for a prompt */
  fetchSuggestions: (prompt: string) => void
  /** Reset to default suggestions */
  reset: () => void
}

/**
 * Hook for generating contextual prompt suggestions.
 *
 * Features:
 * - 300ms debounce by default for typing performance
 * - Falls back to default suggestions on error or empty prompt
 * - Auto-cancels previous requests when prompt changes
 */
export function useSuggestions(
  options: UseSuggestionsOptions = {}
): UseSuggestionsReturn {
  const { debounceMs = DEBOUNCE_MS, minLength = MIN_PROMPT_LENGTH } = options

  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const [isLoading, setIsLoading] = useState(false)

  // Refs for debouncing and cancellation
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastPromptRef = useRef<string>("")

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchSuggestions = useCallback(
    (prompt: string) => {
      const trimmedPrompt = prompt.trim()

      // Skip if prompt hasn't changed
      if (trimmedPrompt === lastPromptRef.current) {
        return
      }
      lastPromptRef.current = trimmedPrompt

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      // Reset to defaults for short prompts
      if (trimmedPrompt.length < minLength) {
        setSuggestions(DEFAULT_SUGGESTIONS)
        setIsLoading(false)
        return
      }

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true)

        try {
          abortControllerRef.current = new AbortController()

          const response = await fetch("/api/suggestions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: trimmedPrompt }),
            signal: abortControllerRef.current.signal,
          })

          const data: SuggestionsResponse = await response.json()

          if (data.success && data.data.suggestions.length > 0) {
            setSuggestions(data.data.suggestions)
          } else {
            // Keep current suggestions on empty response
          }
        } catch (error) {
          // Ignore abort errors
          if (error instanceof Error && error.name === "AbortError") {
            return
          }
          // Log other errors but don't break UI
          console.error("Failed to fetch suggestions:", error)
        } finally {
          setIsLoading(false)
          abortControllerRef.current = null
        }
      }, debounceMs)
    },
    [debounceMs, minLength]
  )

  const reset = useCallback(() => {
    // Clear pending operations
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    // Reset state
    lastPromptRef.current = ""
    setSuggestions(DEFAULT_SUGGESTIONS)
    setIsLoading(false)
  }, [])

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
    reset,
  }
}
