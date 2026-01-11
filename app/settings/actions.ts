"use server"

import { encryptApiKey } from "@/lib/encryption"

/**
 * Encrypts an API key on the server side so it can be safely stored.
 * This avoids exposing the encryption key to the client.
 */
export async function encryptKey(key: string): Promise<string> {
    try {
        return encryptApiKey(key)
    } catch (error) {
        console.error("Failed to encrypt key:", error)
        throw new Error("Failed to encrypt API key")
    }
}
