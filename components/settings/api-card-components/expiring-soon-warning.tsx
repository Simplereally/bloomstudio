"use client";

/**
 * Expiring Soon Warning
 *
 * Alert component shown when connection is expiring within 7 days.
 */

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, Loader2, RefreshCw } from "lucide-react";

export interface ExpiringSoonWarningProps {
  daysUntilExpiry: number | null;
  isRedirecting: boolean;
  onReconnect: () => void;
}

/**
 * Renders a warning alert when the connection is expiring soon.
 */
export function ExpiringSoonWarning({
  daysUntilExpiry,
  isRedirecting,
  onReconnect,
}: ExpiringSoonWarningProps) {
  return (
    <Alert
      variant="default"
      className="bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
    >
      <Clock className="h-4 w-4" />
      <AlertTitle>Connection Expiring Soon</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Your connection expires in {daysUntilExpiry} days. Reconnect now to
          avoid interruption.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          disabled={isRedirecting}
          className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
        >
          {isRedirecting ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1.5" />
          )}
          Reconnect
        </Button>
      </AlertDescription>
    </Alert>
  );
}
