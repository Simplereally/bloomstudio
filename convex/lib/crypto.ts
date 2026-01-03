"use node"

/**
 * Cryptographic utilities for API key encryption/decryption
 * 
 * This module provides AES-256-GCM encryption for storing API keys securely.
 * Requires ENCRYPTION_KEY environment variable to be set in Convex.
 */

import { createDecipheriv } from "crypto"

// ============================================================
// Constants
// ============================================================
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

// ============================================================
// API Key Decryption
// ============================================================

/**
 * Decrypts an encrypted API key using AES-256-GCM.
 * Requires ENCRYPTION_KEY environment variable to be set in Convex.
 * 
 * @param ciphertext - Base64-encoded encrypted API key
 * @returns Decrypted API key as plain text
 * @throws Error if ENCRYPTION_KEY is not set or invalid
 */
export function decryptApiKey(ciphertext: string): string {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
        throw new Error("ENCRYPTION_KEY environment variable is not set in Convex")
    }
    if (encryptionKey.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)")
    }

    const key = Buffer.from(encryptionKey, "hex")
    const combined = Buffer.from(ciphertext, "base64")

    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(-AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH, -AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ])

    return decrypted.toString("utf8")
}
