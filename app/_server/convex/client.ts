import "server-only"
import { auth } from "@clerk/nextjs/server"

/**
 * Get Convex JWT token from Clerk for server-side authenticated requests.
 * Uses the "convex" JWT template configured in Clerk dashboard.
 */
export async function getConvexClerkToken(): Promise<string | undefined> {
    const { getToken } = await auth()
    const token = await getToken({ template: "convex" })
    return token ?? undefined
}

/**
 * Get the current user's Clerk ID for cache key generation.
 * Returns undefined if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | undefined> {
    const { userId } = await auth()
    return userId ?? undefined
}

/**
 * Require authenticated user, throw if not authenticated.
 */
export async function requireUserId(): Promise<string> {
    const userId = await getCurrentUserId()
    if (!userId) {
        throw new Error("Authentication required")
    }
    return userId
}
