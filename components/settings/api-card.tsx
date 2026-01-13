"use client";

/**
 * API Card
 *
 * Settings card for managing Pollinations API connection.
 * Shows BYOP connection status, expiration countdown, and connection actions.
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
  ByopExpiredSection,
  NotConnectedSection,
  ExpiringSoonWarning,
  LegacyKeySection,
} from "./api-card-components";

export function ApiCard() {
  const {
    legacyState,
    byopState,
    connectionStatus,
    actionState,
    handlers,
  } = useApiCardState();

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Pollinations Connection</CardTitle>
            <CardDescription>
              Manage your connection to Pollinations.ai for image generation.
            </CardDescription>
          </div>
          <ConnectionStatusBadge
            status={connectionStatus}
            daysUntilExpiry={byopState.daysUntilExpiry}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BYOP Connection Section */}
        {byopState.isConnected ? (
          <ByopConnectedSection
            daysUntilExpiry={byopState.daysUntilExpiry}
            isRedirecting={actionState.isRedirecting}
            onReconnect={handlers.handleReconnect}
            onDisconnect={handlers.handleDisconnect}
          />
        ) : byopState.isExpired ? (
          <ByopExpiredSection
            isRedirecting={actionState.isRedirecting}
            onReconnect={handlers.handleReconnect}
          />
        ) : !legacyState.hasLegacyKey ? (
          <NotConnectedSection
            isRedirecting={actionState.isRedirecting}
            onConnect={handlers.handleReconnect}
          />
        ) : null}

        {/* Expiring Soon Warning */}
        {byopState.isExpiringSoon && !byopState.isExpired && (
          <ExpiringSoonWarning
            daysUntilExpiry={byopState.daysUntilExpiry}
            isRedirecting={actionState.isRedirecting}
            onReconnect={handlers.handleReconnect}
          />
        )}

        {/* Legacy Key Section - Only shows if user has a legacy key */}
        <LegacyKeySection
          isOpen={actionState.showLegacySection}
          onOpenChange={actionState.setShowLegacySection}
          hasLegacyKey={legacyState.hasLegacyKey}
          isByopConnected={byopState.isConnected}
          isLoading={legacyState.isLegacyLoading}
          isRemoving={actionState.isRemoving}
          onRemove={handlers.handleRemoveLegacyKey}
        />
      </CardContent>
    </Card>
  );
}
