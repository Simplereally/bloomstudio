/**
 * Cryptographic utilities for API key encryption/decryption
 *
 * This module provides AES-256-GCM encryption for storing API keys securely.
 * Uses the Web Crypto API (SubtleCrypto) which is available in the Convex runtime.
 *
 * Requires ENCRYPTION_KEY environment variable to be set in Convex.
 */

// ============================================================
// Constants
// ============================================================
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

// ============================================================
// Helper Functions
// ============================================================
/**
 * Imports and memoizes the encryption key from the environment variable.
 * The key is parsed once and cached for subsequent calls to improve performance.
 */
let cachedKey: CryptoKey | null = null;
async function getEncryptionKey(): Promise<CryptoKey> {
    if (cachedKey) {
        return cachedKey;
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
        throw new Error("ENCRYPTION_KEY environment variable is not set in Convex");
    }
    if (encryptionKey.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)",
        );
    }
    if (!/^[0-9a-fA-F]+$/.test(encryptionKey)) {
        throw new Error(
            "ENCRYPTION_KEY contains invalid hex characters (only 0-9, a-f, A-F are allowed)",
        );
    }

    // Convert to Uint8Array to ensure compatibility with Web Crypto API types
    // (avoiding explicit 'as unknown as BufferSource' casts)
    const keyData = new Uint8Array(Buffer.from(encryptionKey, "hex"));

    cachedKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: ALGORITHM },
        false, // not extractable
        ["encrypt", "decrypt"],
    );

    return cachedKey;
}

// ============================================================
// API Key Encryption
// ============================================================

/**
 * Encrypts an API key using AES-256-GCM.
 * Requires ENCRYPTION_KEY environment variable to be set in Convex.
 *
 * @param apiKey - Plain text API key
 * @returns Base64-encoded encrypted string containing IV and ciphertext (including auth tag)
 * @throws Error if ENCRYPTION_KEY is not set or invalid
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
    const key = await getEncryptionKey();

    // Generate random IV
    const iv = new Uint8Array(IV_LENGTH);
    crypto.getRandomValues(iv);

    // Encode the API key as UTF-8
    const data = Buffer.from(apiKey, "utf8");

    // Encrypt (Web Crypto API includes auth tag in the ciphertext)
    // crypto.subtle.encrypt returns an ArrayBuffer
    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        data,
    );

    // Combine IV + ciphertext (which includes auth tag)
    const combined = Buffer.concat([iv, Buffer.from(ciphertext)]);

    return combined.toString("base64");
}

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
export async function decryptApiKey(ciphertext: string): Promise<string> {
    const key = await getEncryptionKey();

    const combined = Buffer.from(ciphertext, "base64");

    // Extract IV and ciphertext (which includes auth tag)
    // subarray shares memory, similar to slice on TypedArray
    const iv = combined.subarray(0, IV_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        new Uint8Array(encrypted), // explicit Uint8Array for Web Crypto compatibility
    );

    // Decode as UTF-8
    return Buffer.from(decrypted).toString("utf8");
}

