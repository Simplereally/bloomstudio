"use client";

/**
 * Pollinations OAuth Callback Handler
 *
 * This page handles the redirect back from Pollinations after OAuth authorization.
 * It extracts the API key from the URL hash fragment and stores it in Convex.
 *
 * ## Flow
 * 1. User clicks "Connect to Pollinations" in the app
 * 2. User is redirected to Pollinations to authorize
 * 3. Pollinations redirects back here with the API key in the hash: #api_key=sk_...
 * 4. This page extracts the key, validates it, and stores it in Convex (encrypted)
 * 5. User is redirected back to the Studio
 *
 * ## Security Notes
 * - The API key is passed in the URL hash fragment (#), NOT the query string
 * - Hash fragments are never sent to the server, only accessible via JavaScript
 * - The key is stored encrypted in Convex (AES-256-GCM)
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CALLBACK_KEY_PARAM,
  isValidApiKeyFormat,
  buildAuthorizationUrl,
  getCallbackUrl,
} from "@/lib/pollen-auth";

/** Possible states of the callback handler */
type CallbackState =
  | "processing"
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

export default function PollinationsCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("processing");
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const setApiKey = useMutation(api.users.setPollinationsApiKey);

  /**
   * Extracts the API key from the URL hash fragment.
   * The hash format is: #api_key=sk_xxxxx
   */
  const extractKeyFromHash = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return null;

    // Remove the leading # and parse as URLSearchParams
    const params = new URLSearchParams(hash.slice(1));
    return params.get(CALLBACK_KEY_PARAM);
  }, []);

  /**
   * Processes the OAuth callback by extracting and storing the API key.
   */
  const processCallback = useCallback(async () => {
    try {
      // Extract key from hash
      const apiKey = extractKeyFromHash();

      if (!apiKey) {
        setState("error_missing_key");
        return;
      }

      // Validate key format
      if (!isValidApiKeyFormat(apiKey)) {
        setState("error_invalid_key");
        return;
      }

      // Clear the hash from the URL for security (prevent accidental sharing)
      // Do this before the async call to minimize exposure time
      if (typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }

      // Store the key in Convex (encrypted server-side)
      await setApiKey({ apiKey });

      setState("success");
      toast.success("Connected to Pollinations successfully!", {
        description: "You can now generate images with your own Pollen wallet.",
      });
    } catch (error) {
      console.error("[PollinationsCallback] Error processing callback:", error);
      setState("error_save_failed");
    }
  }, [extractKeyFromHash, setApiKey]);

  // Process the callback once Convex auth is ready.
  // We must wait for isAuthLoading to be false before calling the mutation,
  // because after the external OAuth redirect (full page reload), the Clerk
  // auth token needs time to re-initialize and reach the Convex client.
  // The 100ms delay handles browser quirks where window.location.hash
  // isn't populated in the same tick after a redirect.
  useEffect(() => {
    if (isAuthLoading) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setState("error_save_failed");
        return;
      }

      void processCallback();
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthLoading, isAuthenticated, processCallback]);

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
              Connecting to Pollinations...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we complete the authorization.
            </p>
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
