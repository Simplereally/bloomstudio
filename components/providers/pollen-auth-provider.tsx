"use client";

/**
 * Pollen Auth Provider Component
 *
 * Re-exports the PollenAuthProvider for use in the components/providers directory.
 * This follows the existing provider pattern in the application.
 */

import { PollenAuthProvider as BasePollenAuthProvider } from "@/lib/pollen-auth";
import { GlobalReconnectModal } from "@/components/pollen-auth";
import { ReactNode } from "react";

export function PollenAuthProvider({ children }: { children: ReactNode }) {
  return (
    <BasePollenAuthProvider>
      {children}
      <GlobalReconnectModal />
    </BasePollenAuthProvider>
  );
}
