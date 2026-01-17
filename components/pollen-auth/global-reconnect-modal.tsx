"use client"

import { useNeedsReconnect } from "@/lib/pollen-auth"
import { ReconnectModal } from "./reconnect-modal"

export function GlobalReconnectModal() {
  const { needsReconnect, setNeedsReconnect } = useNeedsReconnect()

  if (!needsReconnect) return null

  return (
    <ReconnectModal 
      open={needsReconnect} 
      onOpenChange={setNeedsReconnect} 
    />
  )
}
