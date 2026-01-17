"use client";

/**
 * Connection Status Badge
 *
 * Visual indicator for the current API connection status.
 * Shows loading, not connected, or connected states for BYOP auth.
 */

import type { ConnectionStatus } from "@/hooks/use-api-card-state";
import { Loader2, CheckCircle2 } from "lucide-react";

export interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
}

/**
 * Renders a status badge based on the current connection state.
 */
export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  switch (status) {
    case "loading":
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading
        </div>
      );

    case "not-connected":
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
          Not Connected
        </div>
      );

    case "byop-connected":
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Connected
        </div>
      );
  }
}
