"use client";

/**
 * API Card
 *
 * Settings card for managing Pollinations API connection.
 * Shows BYOP connection status and connection actions.
 *
 * Note: Legacy API key support has been removed. BYOP OAuth is now
 * the only supported authentication method.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApiCardState } from "@/hooks/use-api-card-state";
import {
  ConnectionStatusBadge,
  ByopConnectedSection,
  NotConnectedSection,
} from "./api-card-components";

export function ApiCard() {
  const { byopState, connectionStatus, actionState, handlers, isLoading } =
    useApiCardState();

  if (isLoading) {
    return <ApiCardSkeleton />;
  }

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Pollinations Connection
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground/80">
              Manage your connection to Pollinations.ai for image generation.
            </CardDescription>
          </div>
          <ConnectionStatusBadge status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {byopState.isConnected ? (
          <ByopConnectedSection
            isRedirecting={actionState.isRedirecting}
            onReconnect={handlers.handleReconnect}
            onDisconnect={handlers.handleDisconnect}
          />
        ) : (
          <NotConnectedSection
            isRedirecting={actionState.isRedirecting}
            onConnect={handlers.handleReconnect}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ApiCardSkeleton() {
  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-8 w-32 bg-muted rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-48 w-full bg-muted/20 rounded-xl animate-pulse border border-border/40" />
      </CardContent>
    </Card>
  );
}
