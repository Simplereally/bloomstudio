"use client"

/**
 * Client-only wrapper for Clerk's UserButton to prevent hydration mismatches.
 * Clerk components render dynamic content that doesn't exist during SSR,
 * so we delay rendering until the component is mounted on the client.
 */

import { useSyncExternalStore } from "react"
import { UserButton } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

interface ClerkUserButtonProps {
    afterSignOutUrl?: string
}

export function ClerkUserButton({ afterSignOutUrl = "/" }: ClerkUserButtonProps) {
    const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

    if (!mounted) {
        return <Skeleton data-testid="clerk-user-button-skeleton" className="h-8 w-8 rounded-full" />
    }

    return <UserButton afterSignOutUrl={afterSignOutUrl} />
}
