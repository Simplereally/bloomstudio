/**
 * Toast Error Utilities
 *
 * Provides standardized toast notifications for API errors using Sonner.
 * Maps error codes to appropriate toast types and messages.
 */

import { toast, type ExternalToast } from "sonner"
import {
    PollinationsApiError,
    isPollinationsApiError,
    getErrorMessage,
    ApiErrorCodeConst,
    ClientErrorCodeConst,
    ERROR_MESSAGES,
} from "@/lib/errors"

/**
 * Toast configuration for different error types
 */
interface ErrorToastConfig {
    type: "error" | "warning" | "info"
    duration: number
    action?: {
        label: string
        onClick: () => void
    }
}

/**
 * Get toast configuration based on error code
 */
function getToastConfig(error: PollinationsApiError): ErrorToastConfig {
    switch (error.code) {
        case ApiErrorCodeConst.UNAUTHORIZED:
            return {
                type: "warning",
                duration: 5000,
            }
        case ApiErrorCodeConst.INTERNAL_ERROR:
        case ClientErrorCodeConst.NETWORK_ERROR:
            return {
                type: "error",
                duration: 8000,
            }
        case ApiErrorCodeConst.BAD_REQUEST:
        case ClientErrorCodeConst.VALIDATION_ERROR:
            return {
                type: "error",
                duration: 6000,
            }
        default:
            return {
                type: "error",
                duration: 5000,
            }
    }
}

/**
 * Show an error toast with appropriate styling based on error type.
 *
 * @param error - The error to display
 * @param options - Additional toast options
 * @returns Toast ID for dismissal
 *
 * @example
 * ```ts
 * try {
 *   await generateImage(params)
 * } catch (error) {
 *   showErrorToast(error)
 * }
 * ```
 */
export function showErrorToast(
    error: unknown,
    options?: ExternalToast
): string | number {
    const message = getErrorMessage(error)
    const apiError = isPollinationsApiError(error) ? error : null
    const config = apiError ? getToastConfig(apiError) : { type: "error" as const, duration: 5000 }

    const toastOptions: ExternalToast = {
        duration: config.duration,
        ...options,
    }

    // Add retry action for retryable errors
    if (apiError?.isRetryable && options?.action) {
        toastOptions.action = options.action
    }

    // Add description for validation errors with field details
    if (apiError?.hasFieldErrors) {
        const fieldErrorCount = Object.keys(
            apiError.details.fieldErrors || {}
        ).length
        toastOptions.description = `${fieldErrorCount} field${fieldErrorCount > 1 ? "s" : ""} need${fieldErrorCount === 1 ? "s" : ""} attention`
    }

    switch (config.type) {
        case "warning":
            return toast.warning(message, toastOptions)
        case "info":
            return toast.info(message, toastOptions)
        default:
            return toast.error(message, toastOptions)
    }
}

/**
 * Show a success toast for completed operations.
 *
 * @param message - Success message
 * @param options - Additional toast options
 */
export function showSuccessToast(
    message: string,
    options?: ExternalToast
): string | number {
    return toast.success(message, {
        duration: 3000,
        ...options,
    })
}

/**
 * Show an info toast for general notifications.
 *
 * @param message - Info message
 * @param options - Additional toast options
 */
export function showInfoToast(
    message: string,
    options?: ExternalToast
): string | number {
    return toast.info(message, {
        duration: 4000,
        ...options,
    })
}

/**
 * Show a loading toast that can be updated.
 *
 * @param message - Loading message
 * @returns Toast ID for updates
 *
 * @example
 * ```ts
 * const toastId = showLoadingToast('Generating image...')
 * try {
 *   await generateImage(params)
 *   updateToastSuccess(toastId, 'Image generated!')
 * } catch (error) {
 *   updateToastError(toastId, error)
 * }
 * ```
 */
export function showLoadingToast(message: string): string | number {
    return toast.loading(message)
}

/**
 * Update a toast to show success state.
 *
 * @param toastId - ID of the toast to update
 * @param message - Success message
 */
export function updateToastSuccess(
    toastId: string | number,
    message: string
): void {
    toast.success(message, { id: toastId })
}

/**
 * Update a toast to show error state.
 *
 * @param toastId - ID of the toast to update
 * @param error - Error to display
 */
export function updateToastError(
    toastId: string | number,
    error: unknown
): void {
    const message = getErrorMessage(error)
    toast.error(message, { id: toastId })
}

/**
 * Dismiss a specific toast or all toasts.
 *
 * @param toastId - Optional toast ID to dismiss specific toast
 */
export function dismissToast(toastId?: string | number): void {
    toast.dismiss(toastId)
}

/**
 * Show a rate limit warning toast.
 *
 * @param retryAfter - Seconds until retry is allowed
 */
export function showRateLimitToast(retryAfter?: number): string | number {
    const message = retryAfter
        ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
        : "Rate limit exceeded. Please wait before trying again."

    return toast.warning(message, {
        duration: retryAfter ? retryAfter * 1000 : 10000,
    })
}

/**
 * Show an authentication required toast.
 *
 * @param onSignIn - Optional callback for sign in action
 */
export function showAuthRequiredToast(
    onSignIn?: () => void
): string | number {
    return toast.warning(ERROR_MESSAGES[ApiErrorCodeConst.UNAUTHORIZED], {
        duration: 6000,
        action: onSignIn
            ? {
                  label: "Sign In",
                  onClick: onSignIn,
              }
            : undefined,
    })
}

/**
 * Hook-friendly error handler for TanStack Query.
 *
 * @returns Error handler function for query/mutation options
 *
 * @example
 * ```ts
 * const { mutate } = useMutation({
 *   mutationFn: generateImage,
 *   onError: createToastErrorHandler(),
 * })
 * ```
 */
export function createToastErrorHandler(
    options?: ExternalToast
): (error: unknown) => void {
    return (error: unknown) => {
        showErrorToast(error, options)
    }
}
