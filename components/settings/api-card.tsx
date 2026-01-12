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
import { Key } from "lucide-react";
import { cn } from "@/lib/utils";
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
    isConnected,
    connectionStatus,
    inputState,
    actionState,
    handlers,
  } = useApiCardState();

  // Determine border color based on connection state
  const getBorderColorClass = () => {
    if (isConnected && !byopState.isExpired && !byopState.isExpiringSoon) {
      return "border-l-green-500/50";
    }
    if (byopState.isExpiringSoon) {
      return "border-l-amber-500/50";
    }
    if (byopState.isExpired) {
      return "border-l-destructive/50";
    }
    return "border-l-yellow-500/50";
  };

  return (
    <Card
      className={cn(
        "border-border/50 bg-background/50 backdrop-blur-sm shadow-sm border-l-4",
        getBorderColorClass()
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-500" />
              Pollinations Connection
            </CardTitle>
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

        {/* Legacy Key Section - Collapsible */}
        <LegacyKeySection
          isOpen={actionState.showLegacySection}
          onOpenChange={actionState.setShowLegacySection}
          hasLegacyKey={legacyState.hasLegacyKey}
          isByopConnected={byopState.isConnected}
          isLoading={legacyState.isLegacyLoading}
          inputKey={inputState.inputKey}
          onInputKeyChange={inputState.setInputKey}
          isVisible={inputState.isVisible}
          onToggleVisibility={inputState.toggleVisibility}
          isSaving={actionState.isSaving}
          isRemoving={actionState.isRemoving}
          onSave={handlers.handleSave}
          onRemove={handlers.handleRemoveLegacyKey}
        />
      </CardContent>
    </Card>
  );
}
