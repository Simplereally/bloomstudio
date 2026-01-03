"use client"

/**
 * Error Boundary Component
 *
 * React Error Boundary for catching and displaying generation failures.
 * Provides user-friendly error messages and retry functionality.
 */

import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isPollinationsApiError, getErrorMessage } from "@/lib/errors"

/**
 * Props for the error fallback component
 */
export interface ErrorFallbackProps {
    error: Error
    resetErrorBoundary: () => void
}

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
    children: React.ReactNode
    /** Custom fallback component */
    fallback?: React.ComponentType<ErrorFallbackProps>
    /** Callback when an error is caught */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    /** Callback when reset is triggered */
    onReset?: () => void
    /** Reset keys - changing these will reset the boundary */
    resetKeys?: unknown[]
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
    error,
    resetErrorBoundary,
}: ErrorFallbackProps) {
    const isApiError = isPollinationsApiError(error)
    const apiError = isApiError ? error : null

    const title = apiError?.isValidationError
        ? "Invalid Parameters"
        : apiError?.isAuthError
          ? "Authentication Required"
          : apiError?.isRetryable
            ? "Temporary Error"
            : "Something went wrong"

    const message = getErrorMessage(error)

    const showFieldErrors =
        apiError?.hasFieldErrors && apiError.flatFieldErrors.length > 0

    return (
        <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="space-y-3">
                <p>{message}</p>

                {showFieldErrors && (
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {apiError!.flatFieldErrors.map((fieldError, index) => (
                            <li key={index}>{fieldError}</li>
                        ))}
                    </ul>
                )}

                {apiError?.requestId && (
                    <p className="text-xs text-muted-foreground">
                        Request ID: {apiError.requestId}
                    </p>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={resetErrorBoundary}
                    className="mt-2"
                >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    {apiError?.isRetryable ? "Retry" : "Try Again"}
                </Button>
            </AlertDescription>
        </Alert>
    )
}

/**
 * React Error Boundary for generation failures.
 *
 * Features:
 * - Catches rendering errors in child components
 * - Displays user-friendly error messages
 * - Provides retry functionality
 * - Supports custom fallback components
 * - Auto-reset on resetKeys change
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error) => console.error('Caught:', error)}
 *   onReset={() => refetch()}
 * >
 *   <ImageGenerator />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.props.onError?.(error, errorInfo)
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps): void {
        const { resetKeys } = this.props

        // Reset if resetKeys changed
        if (
            this.state.hasError &&
            resetKeys &&
            prevProps.resetKeys &&
            !this.areKeysEqual(resetKeys, prevProps.resetKeys)
        ) {
            this.reset()
        }
    }

    private areKeysEqual(a: unknown[], b: unknown[]): boolean {
        if (a.length !== b.length) return false
        return a.every((item, index) => Object.is(item, b[index]))
    }

    private reset = (): void => {
        this.props.onReset?.()
        this.setState({ hasError: false, error: null })
    }

    render(): React.ReactNode {
        const { hasError, error } = this.state
        const { children, fallback: FallbackComponent } = this.props

        if (hasError && error) {
            const Fallback = FallbackComponent || DefaultErrorFallback
            return <Fallback error={error} resetErrorBoundary={this.reset} />
        }

        return children
    }
}

/**
 * Hook for using error boundary functionality in function components
 */
export function useErrorBoundary() {
    const [error, setError] = React.useState<Error | null>(null)

    const resetBoundary = React.useCallback(() => {
        setError(null)
    }, [])

    const showBoundary = React.useCallback((err: Error) => {
        setError(err)
    }, [])

    React.useEffect(() => {
        if (error) {
            throw error
        }
    }, [error])

    return { resetBoundary, showBoundary }
}

export { DefaultErrorFallback }
