"use client";

/**
 * Generation Error Component
 *
 * Displays error details for image generation failures.
 * Shows field-level validation errors and provides retry functionality.
 */

import * as React from "react";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PollinationsApiError, isPollinationsApiError, getErrorMessage, ApiErrorCodeConst, ClientErrorCodeConst } from "@/lib/errors";

/**
 * Props for GenerationError component
 */
export interface GenerationErrorProps {
  /** The error to display */
  error: Error | PollinationsApiError | null;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether retry is currently in progress */
  isRetrying?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show detailed error info (e.g., request ID, stack) */
  showDetails?: boolean;
}

/**
 * Displays a single field error
 */
function FieldError({ field, errors }: { field: string; errors: string[] }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-destructive">{field}:</span>
      <ul className="ml-4 list-disc list-inside text-muted-foreground">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Displays error details for image generation failures.
 *
 * Features:
 * - User-friendly error messages based on error code
 * - Field-level validation error display
 * - Collapsible detailed info section
 * - Retry button with loading state
 *
 * @example
 * ```tsx
 * <GenerationError
 *   error={generationError}
 *   onRetry={handleRetry}
 *   isRetrying={isGenerating}
 * />
 * ```
 */
export function GenerationError({ error, onRetry, isRetrying = false, className, showDetails = false }: GenerationErrorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const isApiError = error ? isPollinationsApiError(error) : false;
  const apiError = isApiError && error ? (error as PollinationsApiError) : null;

  // Get the appropriate title - must be before early return
  const title = React.useMemo(() => {
    if (!apiError) return "Generation Failed";

    switch (apiError.code) {
      case ApiErrorCodeConst.BAD_REQUEST:
      case ClientErrorCodeConst.VALIDATION_ERROR:
        return "Invalid Parameters";
      case ApiErrorCodeConst.UNAUTHORIZED:
        return "Authentication Required";
      case ApiErrorCodeConst.INTERNAL_ERROR:
        return "Server Error";
      case ClientErrorCodeConst.NETWORK_ERROR:
        return "Connection Error";
      case ClientErrorCodeConst.GENERATION_FAILED:
        return "Generation Failed";
      default:
        return "Error";
    }
  }, [apiError]);

  if (!error) return null;

  // Determine error variant and icon based on error type
  const variant: "destructive" | "default" = apiError?.isRetryable ? "default" : "destructive";

  // Get the user-friendly message
  const message = getErrorMessage(error);

  // Check for field errors
  const fieldErrors = apiError?.details?.fieldErrors;
  const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;

  // Check for form-level errors
  const formErrors = apiError?.details?.formErrors;
  const hasFormErrors = formErrors && formErrors.length > 0;

  // Detailed info for debugging
  const hasDetails = showDetails && apiError?.requestId;

  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {apiError?.isRetryable && <span className="text-xs font-normal text-muted-foreground">Temporary error</span>}
      </AlertTitle>

      <AlertDescription className="space-y-3">
        <p>{message}</p>

        {/* Form-level errors */}
        {hasFormErrors && (
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            {formErrors.map((formError, index) => (
              <li key={index}>{formError}</li>
            ))}
          </ul>
        )}

        {/* Field-level validation errors */}
        {hasFieldErrors && (
          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <p className="text-sm font-medium">Please fix the following issues:</p>
            <div className="space-y-2">
              {Object.entries(fieldErrors).map(([field, errors]) => (
                <FieldError key={field} field={field} errors={errors as string[]} />
              ))}
            </div>
          </div>
        )}

        {/* Collapsible details section */}
        {hasDetails && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                {isOpen ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
                Technical Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {apiError?.requestId && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Request ID:</span> {apiError.requestId}
                </p>
              )}
              {apiError?.status && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Status:</span> {apiError.status}
                </p>
              )}
              {apiError?.timestamp && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Time:</span> {apiError.timestamp.toLocaleTimeString()}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Retry button */}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying} className="mt-2">
            <RefreshCw className={cn("mr-2 h-3 w-3", isRetrying && "animate-spin")} />
            {isRetrying ? "Retrying..." : apiError?.isRetryable ? "Retry" : "Try Again"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact inline error display for forms
 */
export function InlineError({ error, className }: { error: Error | null; className?: string }) {
  if (!error) return null;

  const message = getErrorMessage(error);

  return (
    <p className={cn("text-sm text-destructive flex items-center gap-1", className)}>
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}
