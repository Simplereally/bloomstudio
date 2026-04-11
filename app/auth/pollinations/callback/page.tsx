"use client";

/**
 * Pollinations OAuth Callback Handler
 *
 * This page handles the redirect back from Pollinations after OAuth authorization.
 * It extracts the API key from the URL hash fragment and stores it in Convex
 * through an authenticated server action.
 *
 * ## Flow
 * 1. User clicks "Connect to Pollinations" in the app
 * 2. User is redirected to Pollinations to authorize
 * 3. Pollinations redirects back here with the API key in the hash: #api_key=sk_...
 * 4. This page extracts and validates the key using browser-only URL access
 * 5. User confirms the connection, then a server action stores it in Convex (encrypted)
 * 6. User is redirected back to the Studio
 *
 * ## Security Notes
 * - The API key is passed in the URL hash fragment (#), NOT the query string
 * - Hash fragments are never sent to the server, only accessible via JavaScript
 * - The key is stored encrypted in Convex (AES-256-GCM)
 */

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CALLBACK_KEY_PARAM,
  isValidApiKeyFormat,
  buildAuthorizationUrl,
  getCallbackUrl,
} from "@/lib/pollen-auth";
import {
  savePollinationsApiKey,
  type SavePollinationsApiKeyResult,
} from "./actions";

/** Possible states of the callback handler */
type CallbackState =
  | "processing"
  | "ready"
  | "success"
  | "error_missing_key"
  | "error_invalid_key"
  | "error_save_failed";

/** Error messages for each error state */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  error_missing_key: {
    title: "Authorization Cancelled",
    description:
      "No API key was received. This usually happens if authorization was cancelled.",
  },
  error_invalid_key: {
    title: "Invalid API Key",
    description:
      "The received API key appears to be invalid. Please try authorizing again.",
  },
  error_save_failed: {
    title: "Connection Error",
    description:
      "Failed to save your connection. Please check your internet connection and try again.",
  },
};

/** Default redirect path when returnTo is invalid or missing */
const DEFAULT_RETURN_PATH = "/studio";
const INITIAL_ACTION_RESULT: SavePollinationsApiKeyResult = { status: "idle" };
const PROCESSING_DELAY_MS = 100;

/**
 * Validates that a returnTo path is safe for redirection.
 * Prevents open-redirect attacks by ensuring the path is:
 * - A local path (starts with "/")
 * - Not an absolute URL (no protocol or double slashes)
 * - Doesn't contain suspicious characters that could be used for attacks
 *
 * @param returnTo - The return path to validate
 * @returns true if the path is safe for redirection
 */
function isSafeReturnTo(returnTo: string | null): returnTo is string {
  if (!returnTo) return false;

  // Must start with exactly one forward slash (local path)
  if (!returnTo.startsWith("/")) return false;

  // Reject paths starting with "//" (protocol-relative URLs)
  if (returnTo.startsWith("//")) return false;

  // Reject URLs with encoded protocol attempts or suspicious patterns
  // This catches patterns like "/\\evil.com" or "/@evil.com"
  if (/[\\\/]{2,}|@/.test(returnTo)) return false;

  // Reject if contains encoded characters that could bypass checks
  // Match %2f (/) %5c (\) %3a (:) %40 (@) in any case
  if (/%(?:2f|5c|3a|40)/i.test(returnTo)) return false;

  return true;
}

/**
 * Gets a safe returnTo path from search params, falling back to default.
 *
 * @param searchParams - URLSearchParams or compatible object
 * @returns A validated local path safe for redirection
 */
function getSafeReturnTo(searchParams: {
  get: (key: string) => string | null;
}): string {
  const returnTo = searchParams.get("returnTo");
  return isSafeReturnTo(returnTo) ? returnTo : DEFAULT_RETURN_PATH;
}

function clearUrlHash() {
  if (typeof window === "undefined") return;

  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

export default function PollinationsCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [callbackState, setCallbackState] =
    useState<CallbackState>("processing");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const hasShownSuccessToast = useRef(false);
  const [actionResult, submitConnection, isPending] = useActionState(
    async (
      _previousState: SavePollinationsApiKeyResult,
      _formData: FormData,
    ) => savePollinationsApiKey(apiKey),
    INITIAL_ACTION_RESULT,
  );
  const state: CallbackState = isPending
    ? "processing"
    : actionResult.status === "idle"
      ? callbackState
      : actionResult.status;

  /**
   * Extracts the API key from the URL hash fragment.
   * The hash format is: #api_key=sk_xxxxx
   */
  const extractKeyFromHash = useCallback(
    (rawHash?: string | null): string | null => {
      if (typeof window === "undefined") return null;

      const hash = rawHash ?? window.location.hash;
      if (!hash || hash.length < 2) return null;

      // Remove the leading # and parse as URLSearchParams
      const params = new URLSearchParams(hash.slice(1));
      return params.get(CALLBACK_KEY_PARAM);
    },
    [],
  );

  /**
   * Extracts and validates the OAuth callback hash. This effect is limited to
   * browser-only URL access and state updates; the Convex write happens only
   * through the form action.
   */
  useEffect(() => {
    let callbackHash = window.location.hash;

    if (callbackHash) {
      // Clear the hash from the URL for security (prevent accidental sharing)
      // before waiting for browser redirect timing quirks to settle.
      clearUrlHash();
    }

    const timer = window.setTimeout(() => {
      if (!callbackHash && window.location.hash) {
        callbackHash = window.location.hash;
        clearUrlHash();
      }

      const apiKey = extractKeyFromHash(callbackHash);

      if (!apiKey) {
        setCallbackState("error_missing_key");
        return;
      }

      if (!isValidApiKeyFormat(apiKey)) {
        setCallbackState("error_invalid_key");
        return;
      }

      setApiKey(apiKey);
      setCallbackState("ready");
    }, PROCESSING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [extractKeyFromHash]);

  useEffect(() => {
    if (actionResult.status === "success" && !hasShownSuccessToast.current) {
      hasShownSuccessToast.current = true;
      toast.success("Connected to Pollinations successfully!", {
        description: "You can now generate images with your own Pollen wallet.",
      });
    }
  }, [actionResult.status]);

  // Redirect countdown for success state
  // Note: We must NOT call router.push inside setRedirectCountdown, as this would
  // trigger a state update in Router while React is rendering this component.
  // Instead, we track the countdown separately and navigate in a separate effect.
  useEffect(() => {
    if (state !== "success") return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  // Separate effect to handle navigation when countdown reaches 0
  useEffect(() => {
    if (state === "success" && redirectCountdown === 0) {
      router.push(getSafeReturnTo(searchParams));
    }
  }, [state, redirectCountdown, router, searchParams]);

  /**
   * Handles retry by redirecting back to Pollinations auth.
   */
  const handleRetry = useCallback(() => {
    // Use centralized helpers to construct the authorization URL
    window.location.href = buildAuthorizationUrl(getCallbackUrl());
  }, []);

  /**
   * Handles navigation back to the previous page or studio.
   */
  const handleGoBack = useCallback(() => {
    router.push(getSafeReturnTo(searchParams));
  }, [router, searchParams]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="mx-auto max-w-md space-y-6 text-center">
        {state === "processing" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">
              {isPending
                ? "Saving your connection..."
                : "Connecting to Pollinations..."}
            </h1>
            <p className="text-muted-foreground">
              Please wait while we complete the authorization.
            </p>
          </>
        )}

        {state === "ready" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold">
              Finish connecting to Pollinations
            </h1>
            <p className="text-muted-foreground">
              Your Pollinations key is ready to save.
            </p>
            <form action={submitConnection}>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Finish Connection
              </Button>
            </form>
          </>
        )}

        {state === "success" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold">
              Successfully Connected! 🎉
            </h1>
            <p className="text-muted-foreground">
              Your Pollinations account is now connected. You can start
              generating images with your own Pollen wallet.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting in {redirectCountdown} seconds...
            </p>
            <Button onClick={handleGoBack} className="gap-2">
              Go to Studio
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {state.startsWith("error") && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold">
              {ERROR_MESSAGES[state]?.title ?? "Connection Failed"}
            </h1>
            <p className="text-muted-foreground">
              {ERROR_MESSAGES[state]?.description ??
                "An unexpected error occurred."}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleRetry} variant="default">
                Try Again
              </Button>
              <Button onClick={handleGoBack} variant="outline">
                Back to Studio
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
