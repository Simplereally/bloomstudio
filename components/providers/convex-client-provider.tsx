"use client"

/**
 * Convex Client Provider
 *
 * Client component wrapper for ConvexProviderWithClerk.
 * Must be used as a client component since it uses hooks.
 */
import { ReactNode } from "react"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useAuth } from "@clerk/nextjs"

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file")
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)

interface ConvexClientProviderProps {
    children: ReactNode
}

/**
 * ConvexClientProvider wraps the application with Convex's React client
 * and integrates with Clerk authentication.
 */
export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
    return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
        </ConvexProviderWithClerk>
    )
}
