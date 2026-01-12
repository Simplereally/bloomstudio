"use client";

/**
 * Legacy Key Section
 *
 * Collapsible section for manual API key entry (legacy method).
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export interface LegacyKeySectionProps {
  // State
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hasLegacyKey: boolean;
  isByopConnected: boolean;
  isLoading: boolean;

  // Input state
  inputKey: string;
  onInputKeyChange: (value: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;

  // Action states
  isSaving: boolean;
  isRemoving: boolean;

  // Handlers
  onSave: () => void;
  onRemove: () => void;
}

/**
 * Renders a collapsible section for legacy API key management.
 */
export function LegacyKeySection({
  isOpen,
  onOpenChange,
  hasLegacyKey,
  isByopConnected,
  isLoading,
  inputKey,
  onInputKeyChange,
  isVisible,
  onToggleVisibility,
  isSaving,
  isRemoving,
  onSave,
  onRemove,
}: LegacyKeySectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1"
        >
          <span>
            {hasLegacyKey ? "Legacy API Key (active)" : "Manual API Key Entry"}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 pt-2">
          {!isByopConnected && (
            <Alert
              variant="default"
              className="bg-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Legacy Option</AlertTitle>
              <AlertDescription className="text-xs opacity-90 mt-1">
                Manual API key entry is for advanced users. We recommend using
                the &quot;Connect with Pollinations&quot; option above for
                easier setup.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey">Pollinations API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={isVisible ? "text" : "password"}
                  value={inputKey}
                  onChange={(e) => onInputKeyChange(e.target.value)}
                  placeholder={
                    isLoading
                      ? "Loading..."
                      : hasLegacyKey
                        ? "Key is set and hidden"
                        : "Enter your API key"
                  }
                  className="pr-10 bg-background/50"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={onToggleVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {isVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Button
                onClick={onSave}
                disabled={!inputKey.trim() || isSaving || isLoading}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
            {hasLegacyKey && (
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      disabled={isRemoving || isLoading}
                    >
                      {isRemoving ? "Removing..." : "Remove Key"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove your API key? You will
                        need to provide it again to use your personal rate
                        limits.
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
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
