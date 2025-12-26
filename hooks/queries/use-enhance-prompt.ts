"use client"

/**
 * useEnhancePrompt Hook
 *
 * TanStack Query mutation hook for prompt enhancement.
 * Provides enhancement functionality with cancellation support.
 */

import { useMutation } from "@tanstack/react-query"
import { useCallback, useRef } from "react"

/**
 * Request payload for the enhance-prompt API
 */
interface EnhancePromptRequest {
  prompt: string
  negativePrompt?: string
  type: "prompt" | "negative"
}

/**
 * API response types
 */
interface EnhancePromptSuccessResponse {
  success: true
  data: {
    enhancedText: string
  }
}

interface EnhancePromptErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

type EnhancePromptResponse = EnhancePromptSuccessResponse | EnhancePromptErrorResponse

/**
 * Custom error class for enhancement errors
 */
export class EnhancementError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message)
    this.name = "EnhancementError"
  }
}

/**
 * Options for the useEnhancePrompt hook
 */
export interface UseEnhancePromptOptions {
  /** Callback fired on successful enhancement */
  onSuccess?: (enhancedText: string, request: EnhancePromptRequest) => void

  /** Callback fired on enhancement error */
  onError?: (error: EnhancementError, request: EnhancePromptRequest) => void
}

/**
 * Parameters for triggering enhancement
 */
export interface EnhanceParams {
  /** The main prompt text */
  prompt: string
  /** The negative prompt text (used for context in negative enhancement) */
  negativePrompt?: string
  /** Type of enhancement */
  type: "prompt" | "negative"
}

/**
 * Return type for useEnhancePrompt hook
 */
export interface UseEnhancePromptReturn {
  /** Trigger enhancement */
  enhance: (params: EnhanceParams) => void

  /** Cancel the current enhancement request */
  cancel: () => void

  /** Whether enhancement is in progress */
  isEnhancing: boolean

  /** Whether the last enhancement was successful */
  isSuccess: boolean

  /** Whether the last enhancement failed */
  isError: boolean

  /** Error from the last failed enhancement */
  error: EnhancementError | null

  /** The last successfully enhanced text */
  data: string | undefined

  /** Reset the mutation state */
  reset: () => void
}

/**
 * Fetches enhanced prompt from the API with AbortController support
 */
async function fetchEnhancedPrompt(
  request: EnhancePromptRequest,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch("/api/enhance-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  })

  const data: EnhancePromptResponse = await response.json()

  if (!data.success) {
    throw new EnhancementError(
      data.error.message,
      data.error.code,
      response.status
    )
  }

  return data.data.enhancedText
}

/**
 * Hook for enhancing image generation prompts via the server-side API.
 *
 * Provides:
 * - Server-side enhancement using OpenRouter
 * - Cancellation support via AbortController
 * - Automatic loading state management
 * - Error handling with typed EnhancementError
 *
 * @example
 * ```tsx
 * const { enhance, cancel, isEnhancing, error } = useEnhancePrompt({
 *   onSuccess: (enhancedText) => {
 *     setPrompt(enhancedText)
 *   }
 * })
 *
 * // Trigger enhancement
 * enhance({ prompt: 'a cat', type: 'prompt' })
 *
 * // Cancel if needed
 * cancel()
 * ```
 */
export function useEnhancePrompt(
  options: UseEnhancePromptOptions = {}
): UseEnhancePromptReturn {
  // Keep track of the current AbortController
  const abortControllerRef = useRef<AbortController | null>(null)

  const mutation = useMutation<
    string,
    EnhancementError,
    EnhancePromptRequest
  >({
    mutationFn: async (request) => {
      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController()
      return fetchEnhancedPrompt(request, abortControllerRef.current.signal)
    },

    onSuccess: (enhancedText, request) => {
      abortControllerRef.current = null
      options.onSuccess?.(enhancedText, request)
    },

    onError: (error, request) => {
      abortControllerRef.current = null
      options.onError?.(error, request)
    },
  })

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      mutation.reset()
    }
  }, [mutation])

  const enhance = useCallback(
    (params: EnhanceParams) => {
      // Cancel any existing request first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      mutation.mutate(params)
    },
    [mutation]
  )

  return {
    enhance,
    cancel,
    isEnhancing: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

/**
 * Type guard for EnhancementError
 */
export function isEnhancementError(error: unknown): error is EnhancementError {
  return error instanceof EnhancementError
}
