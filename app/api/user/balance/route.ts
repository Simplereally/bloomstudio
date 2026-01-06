/**
 * API Route: Get User Balance (Pending Spend)
 *
 * Proxies to gen.pollinations.ai/api/polar/customer/pending-spend
 * using the user's encrypted Pollinations API key.
 * Only accessible to authenticated users with a stored API key.
 */
import { api } from "@/convex/_generated/api"
import { getAuthorizationHeader } from "@/lib/auth"
import { decryptApiKey } from "@/lib/encryption"
import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { NextResponse } from "next/server"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const POLLINATIONS_BALANCE_URL = "https://gen.pollinations.ai/api/usage?limit=100"

/**
 * GET /api/user/balance
 *
 * Fetches the user's pending spend/balance from Pollinations API.
 * Requires authentication and a stored Pollinations API key.
 */
export async function GET(): Promise<NextResponse> {
    try {
        const { userId, getToken } = await auth()
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get Clerk token for Convex authentication
        const token = await getToken({ template: "convex" })
        if (!token) {
            return NextResponse.json(
                { error: "Failed to get authentication token" },
                { status: 401 }
            )
        }

        // Set the auth token for Convex
        convex.setAuth(token)

        // Get the encrypted API key from Convex
        const encryptedApiKey = await convex.query(api.users.getPollinationsApiKey)

        if (!encryptedApiKey) {
            return NextResponse.json(
                { error: "No API key configured. Please add your Pollinations API key in settings." },
                { status: 404 }
            )
        }

        // Decrypt the API key
        let apiKey: string
        try {
            apiKey = decryptApiKey(encryptedApiKey)
        } catch {
            return NextResponse.json(
                { error: "Failed to decrypt API key" },
                { status: 500 }
            )
        }

        // Build authorization header
        const authHeader = getAuthorizationHeader(apiKey)

        // Safely mask the API key for logging (only in development)
        // Handles edge cases: short keys, empty keys, malformed keys
        const maskApiKey = (key: string | undefined): string => {
            if (!key) return "[none]"
            if (key.length <= 8) return "****" // Don't expose any part of very short keys
            return `${key.slice(0, 4)}...${key.slice(-4)}`
        }

        // Only log in development to avoid leaking any info in production
        if (process.env.NODE_ENV === "development") {
            console.log(`[/api/user/balance] Fetching balance with key: ${maskApiKey(apiKey)}`)
        }

        // Fetch balance from Pollinations API
        const response = await fetch(POLLINATIONS_BALANCE_URL, {
            method: "GET",
            headers: {
                ...(authHeader && { Authorization: authHeader }),
            },
            cache: "no-store",
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(
                `[/api/user/balance] Pollinations API error: ${response.status} ${response.statusText}`
            )
            console.error(`[/api/user/balance] Error response body: ${errorBody}`)
            return NextResponse.json(
                { error: `Failed to fetch balance: ${response.statusText}`, details: errorBody },
                { status: response.status }
            )
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error("[/api/user/balance] Unexpected error:", error)
        return NextResponse.json(
            { error: "Failed to fetch balance" },
            { status: 500 }
        )
    }
}
