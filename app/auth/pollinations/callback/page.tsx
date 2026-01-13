"use client";

/**
 * Pollinations OAuth Callback Handler
 *
 * This page handles the redirect back from Pollinations after OAuth authorization.
 * It extracts the API key from the URL hash fragment and stores it in localStorage.
 *
 * ## Flow
 * 1. User clicks "Connect to Pollinations" in the app
 * 2. User is redirected to Pollinations to authorize
 * 3. Pollinations redirects back here with the API key in the hash: #api_key=sk_...
 * 4. This page extracts the key, validates it, and stores it
 * 5. User is redirected back to the Studio
 *
 * ## Security Notes
 * - The API key is passed in the URL hash fragment (#), NOT the query string
 * - Hash fragments are never sent to the server, only accessible via JavaScript
 * - This provides implicit security as the key never touches server logs
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CALLBACK_KEY_PARAM,
  storeApiKey,
  isValidApiKeyFormat,
} from "@/lib/pollen-auth";

/** Possible states of the callback handler */
type CallbackState =
  | "processing"
  | "success"
  | "error_missing_key"
  | "error_invalid_key"
  | "error_storage";

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
  error_storage: {
    title: "Storage Error",
    description:
      "Failed to store the API key. Please ensure cookies and localStorage are enabled.",
  },
};

export default function PollinationsCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("processing");
  const [redirectCountdown, setRedirectCountdown] = useState(3);

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
  const processCallback = useCallback(() => {
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

      // Store the key
      const stored = storeApiKey(apiKey);
      if (!stored) {
        setState("error_storage");
        return;
      }

      // Clear the hash from the URL for security (prevent accidental sharing)
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }

      setState("success");
      toast.success("Connected to Pollinations successfully!", {
        description: "You can now generate images with your own Pollen wallet.",
      });
    } catch (error) {
      console.error("[PollinationsCallback] Error processing callback:", error);
      setState("error_storage");
    }
  }, [extractKeyFromHash]);

  // Process the callback on mount
  useEffect(() => {
    // Small delay to ensure hash is available after navigation
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [processCallback]);

  // Redirect countdown for success state
  useEffect(() => {
    if (state !== "success") return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          const returnTo = searchParams.get("returnTo") || "/studio";
          router.push(returnTo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, router, searchParams]);

  /**
   * Handles retry by redirecting back to Pollinations auth.
   */
  const handleRetry = useCallback(() => {
    // Import authorize function from context would require provider
    // For the callback page, we redirect directly
    const currentUrl = window.location.origin + "/auth/pollinations/callback";
    window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(currentUrl)}`;
  }, []);

  /**
   * Handles navigation back to the previous page or studio.
   */
  const handleGoBack = useCallback(() => {
    const returnTo = searchParams.get("returnTo") || "/studio";
    router.push(returnTo);
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
