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

// Environment variable validation
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/**
 * Detect true production environment.
 * 
 * VERCEL_ENV is set by Vercel to 'production', 'preview', or 'development'.
 * For local builds, we fall back to checking NODE_ENV and if localhost patterns are absent.
 */
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV
const IS_VERCEL_PRODUCTION = VERCEL_ENV === "production"
const IS_NODE_PRODUCTION = process.env.NODE_ENV === "production"

if (!CONVEX_URL) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file")
}

/**
 * Production key validation.
 * 
 * Only validates in true production environments (Vercel production deployment).
 * Preview and development environments can safely use test keys.
 */
if (IS_VERCEL_PRODUCTION) {
    // Validate Clerk publishable key is not a test key in production
    if (CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
        throw new Error(
            "[Security Error] Test Clerk publishable key detected in production deployment. " +
            "Please configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY with a production key (pk_live_...)."
        )
    }

    // Validate Convex URL doesn't contain development indicators
    if (CONVEX_URL.includes(".convex.cloud") && CONVEX_URL.includes("-dev-")) {
        console.warn(
            "[Security Warning] Convex URL appears to be a development instance. " +
            "Ensure this is intentional for this production deployment."
        )
    }
} else if (IS_NODE_PRODUCTION && !VERCEL_ENV) {
    // Local production build - issue warning but don't block
    if (CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
        console.warn(
            "[Security Warning] Test Clerk publishable key detected in production build. " +
            "In a true production deployment, use a production key (pk_live_...)."
        )
    }
}

const convex = new ConvexReactClient(CONVEX_URL)

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
