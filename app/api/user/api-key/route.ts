/**
 * API Route: Save Pollinations API Key
 *
 * Encrypts and stores the user's Pollinations API key in Convex.
 * Only accessible to authenticated users.
 */
import { ConvexHttpClient } from "convex/browser"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"
import { encryptApiKey } from "@/lib/encryption"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { apiKey } = body

        if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
            return NextResponse.json(
                { error: "API key is required" },
                { status: 400 }
            )
        }

        // Validate API key format (starts with sk_)
        if (!apiKey.trim().startsWith("sk_")) {
            return NextResponse.json(
                { error: "Invalid API key format. Key should start with sk_" },
                { status: 400 }
            )
        }

        // Encrypt the API key
        const encryptedApiKey = encryptApiKey(apiKey.trim())

        // Get Clerk token for Convex authentication
        const { getToken } = await auth()
        const token = await getToken({ template: "convex" })

        if (!token) {
            return NextResponse.json(
                { error: "Failed to get authentication token" },
                { status: 401 }
            )
        }

        // Set the auth token for Convex
        convex.setAuth(token)

        // Ensure user exists in Convex
        await convex.mutation(api.users.getOrCreateUser)

        // Store the encrypted API key
        await convex.mutation(api.users.setPollinationsApiKey, { encryptedApiKey })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error saving API key:", error)
        return NextResponse.json(
            { error: "Failed to save API key" },
            { status: 500 }
        )
    }
}
