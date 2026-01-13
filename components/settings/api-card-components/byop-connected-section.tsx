"use client";

/**
 * BYOP Connected Section
 *
 * Shows the connected state for BYOP authentication with expiry info and actions.
 */

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw, LogOut, Zap } from "lucide-react";

export interface ByopConnectedSectionProps {
  daysUntilExpiry: number | null;
  isRedirecting: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
}

/**
 * Renders the connected state for BYOP authentication.
 * Shows expiry countdown and provides reconnect/disconnect actions.
 */
export function ByopConnectedSection({
  daysUntilExpiry,
  isRedirecting,
  onReconnect,
  onDisconnect,
}: ByopConnectedSectionProps) {
  return (
    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-green-500 fill-current" />
        <span className="font-medium text-foreground">Connected via BYOP</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Your Pollinations connection is active.
        {daysUntilExpiry !== null && (
          <span className="block mt-1">
            Expires in{" "}
            <span className="font-medium text-foreground">
              {daysUntilExpiry} days
            </span>
            .
          </span>
        )}
      </p>
      <div className="flex gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={onReconnect}
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1.5" />
          )}
          Reconnect
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect from Pollinations?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your current connection. You&apos;ll need to
                reconnect to continue generating images.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
