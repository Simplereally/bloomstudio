"use client";

/**
 * BYOP Expired Section
 *
 * Shows the expired state with a prompt to reconnect.
 */

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export interface ByopExpiredSectionProps {
  isRedirecting: boolean;
  onReconnect: () => void;
}

/**
 * Renders an alert when the BYOP connection has expired.
 * Prompts user to reconnect.
 */
export function ByopExpiredSection({
  isRedirecting,
  onReconnect,
}: ByopExpiredSectionProps) {
  return (
    <Alert
      variant="destructive"
      className="bg-destructive/5 border-destructive/20"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection Expired</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Your Pollinations connection has expired. Reconnect to continue
          generating images.
        </p>
        <Button onClick={onReconnect} disabled={isRedirecting} size="sm">
          {isRedirecting ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1.5" />
          )}
          Reconnect Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
