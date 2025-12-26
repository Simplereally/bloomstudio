/**
 * API Key Encryption Utilities
 *
 * Server-side encryption for sensitive API keys using AES-256-GCM.
 * This should only be used on the server side (API routes, server actions).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // GCM standard IV length
const AUTH_TAG_LENGTH = 16 // GCM auth tag length

/**
 * Gets the encryption key from environment variables.
 * The key should be a 32-byte (64 character hex) string.
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
        throw new Error("ENCRYPTION_KEY environment variable is not set")
    }
    if (key.length !== 64) {
        throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)")
    }
    return Buffer.from(key, "hex")
}

/**
 * Encrypts an API key using AES-256-GCM.
 * Returns a base64 encoded string containing IV + ciphertext + auth tag.
 *
 * @param plaintext - The API key to encrypt
 * @returns Encrypted string (base64 encoded)
 */
export function encryptApiKey(plaintext: string): string {
    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([iv, encrypted, authTag])

    return combined.toString("base64")
}

/**
 * Decrypts an encrypted API key.
 *
 * @param ciphertext - The encrypted string (base64 encoded)
 * @returns Decrypted API key
 */
export function decryptApiKey(ciphertext: string): string {
    const key = getEncryptionKey()
    const combined = Buffer.from(ciphertext, "base64")

    // Extract IV, encrypted data, and auth tag
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

/**
 * Validates that an encrypted API key can be decrypted.
 * Useful for checking if the encryption key is correct.
 *
 * @param ciphertext - The encrypted string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEncryptedApiKey(ciphertext: string): boolean {
    try {
        decryptApiKey(ciphertext)
        return true
    } catch {
        return false
    }
}

/**
 * Generates a new encryption key suitable for ENCRYPTION_KEY environment variable.
 * Run this once to generate a key, then store it securely.
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString("hex")
}
