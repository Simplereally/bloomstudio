"use client";

/**
 * Not Connected Section
 *
 * Shows the initial state when user hasn't connected to Pollinations.
 */

import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";

export interface NotConnectedSectionProps {
  isRedirecting: boolean;
  onConnect: () => void;
}

/**
 * Renders the not-connected state with a prompt to connect.
 */
export function NotConnectedSection({
  isRedirecting,
  onConnect,
}: NotConnectedSectionProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">
          Connect to Pollinations
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Connect your Pollinations account to enable image generation with zero
        API costs.
      </p>
      <Button
        onClick={onConnect}
        disabled={isRedirecting}
        className="w-full sm:w-auto"
      >
        {isRedirecting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Zap className="w-4 h-4 mr-2 fill-current" />
        )}
        Connect with Pollinations
      </Button>
    </div>
  );
}
