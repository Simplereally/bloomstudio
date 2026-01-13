"use client";

/**
 * Connection Status Badge
 *
 * Visual indicator for the current API connection status.
 */

import type { ConnectionStatus } from "@/hooks/use-api-card-state";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  daysUntilExpiry: number | null;
}

/**
 * Renders a status badge based on the current connection state.
 */
export function ConnectionStatusBadge({
  status,
  daysUntilExpiry,
}: ConnectionStatusBadgeProps) {
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

    case "expired":
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Expired
        </div>
      );

    case "expiring-soon":
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          Expires in {daysUntilExpiry} days
        </div>
      );

    case "byop-connected":
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Connected ({daysUntilExpiry}d)
        </div>
      );

    case "legacy-active":
    default:
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active
        </div>
      );
  }
}
