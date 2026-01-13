"use client";

/**
 * Legacy Key Section
 *
 * Collapsible section for managing existing legacy API keys.
 * Manual key entry has been deprecated in favor of BYOP OAuth.
 * This section only allows viewing status and removing legacy keys.
 */

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export interface LegacyKeySectionProps {
  // State
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasLegacyKey: boolean;
  isByopConnected: boolean;
  isLoading: boolean;

  // Action states
  isRemoving: boolean;

  // Handlers
  onRemove: () => void;
}

/**
 * Renders a collapsible section for legacy API key management.
 * Only shows for users who have existing legacy keys.
 */
export function LegacyKeySection({
  isOpen,
  onOpenChange,
  hasLegacyKey,
  isByopConnected,
  isLoading,
  isRemoving,
  onRemove,
}: LegacyKeySectionProps) {
  // Don't render if no legacy key and BYOP is connected
  // Users should use BYOP for new connections
  if (!hasLegacyKey) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1"
        >
          <span>Legacy API Key {isByopConnected ? "(inactive)" : "(active)"}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 pt-2">
          {isByopConnected ? (
            <Alert
              variant="default"
              className="bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>BYOP Connected</AlertTitle>
              <AlertDescription className="text-xs opacity-90 mt-1">
                You&apos;re using BYOP authentication. The legacy key below can
                be safely removed.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert
              variant="default"
              className="bg-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Legacy Key Active</AlertTitle>
              <AlertDescription className="text-xs opacity-90 mt-1">
                You&apos;re using a legacy API key. We recommend connecting via
                BYOP for a better experience with automatic key renewal.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>API Key Status</Label>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/50">
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : "Key is set and hidden"}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                    disabled={isRemoving || isLoading}
                  >
                    {isRemoving && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isRemoving ? "Removing..." : "Remove Key"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Legacy API Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isByopConnected
                        ? "Your BYOP connection will remain active. This just removes the old legacy key."
                        : "Are you sure? You will need to connect via BYOP to continue using the service."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onRemove}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove Key
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
