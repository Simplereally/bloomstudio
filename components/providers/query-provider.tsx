"use client"

/**
 * TanStack Query Provider
 *
 * Client-side provider component for TanStack Query.
 * Implements proper patterns for Next.js App Router.
 */

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query"

interface QueryProviderProps {
    children: React.ReactNode
}

/**
 * QueryProvider wraps the application with TanStack Query's QueryClientProvider.
 * Uses the singleton pattern to prevent creating multiple clients in the browser.
 */
export function QueryProvider({ children }: QueryProviderProps) {
    // NOTE: Using getQueryClient() ensures we use the singleton pattern.
    // In Next.js App Router, this component re-renders on navigation, but the
    // queryClient singleton ensures we maintain cache across navigations.
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}
