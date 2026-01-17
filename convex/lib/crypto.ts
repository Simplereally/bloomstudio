/**
 * Cryptographic utilities for API key encryption/decryption
 *
 * This module provides AES-256-GCM encryption for storing API keys securely.
 * Uses the Web Crypto API (SubtleCrypto) which is available in the Convex runtime.
 *
 * IMPORTANT: This module runs in the Convex V8 isolate runtime, NOT Node.js.
 * Therefore, we must use Web-standard APIs only (no Node.js Buffer).
 *
 * Requires ENCRYPTION_KEY environment variable to be set in Convex.
 */

// ============================================================
// Constants
// ============================================================
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

// ============================================================
// Web-Standard Helper Functions (no Node.js Buffer)
// ============================================================

/**
 * Converts a hex string to a Uint8Array.
 * Web-standard replacement for Buffer.from(hex, "hex").
 */
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

/**
 * Converts a Uint8Array to a base64 string.
 * Web-standard replacement for Buffer.toString("base64").
 */
function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Converts a base64 string to a Uint8Array.
 * Web-standard replacement for Buffer.from(base64, "base64").
 */
function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Concatenates multiple Uint8Arrays into one.
 * Web-standard replacement for Buffer.concat().
 */
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * Converts a Uint8Array to a proper ArrayBuffer.
 * Used to satisfy TypeScript's strict BufferSource types for Web Crypto API.
 * Creates a new ArrayBuffer (not a view) to avoid SharedArrayBuffer type issues.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    // Create a new ArrayBuffer and copy the data
    // This ensures we get a proper ArrayBuffer type (not ArrayBuffer | SharedArrayBuffer)
    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    return buffer;
}

// TextEncoder/TextDecoder for UTF-8 string conversion
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// ============================================================
// Encryption Key Management
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

    // Convert hex string to Uint8Array using Web-standard helper
    const keyData = hexToBytes(encryptionKey);

    cachedKey = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(keyData),
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

    // Encode the API key as UTF-8 using TextEncoder
    const data = textEncoder.encode(apiKey);

    // Encrypt (Web Crypto API includes auth tag in the ciphertext)
    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: toArrayBuffer(iv) },
        key,
        data,
    );

    // Combine IV + ciphertext (which includes auth tag)
    const combined = concatBytes(iv, new Uint8Array(ciphertext));

    // Convert to base64 for storage
    return bytesToBase64(combined);
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

    // Decode base64 to bytes
    const combined = base64ToBytes(ciphertext);

    // Extract IV and encrypted data (which includes auth tag)
    const iv = combined.subarray(0, IV_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: toArrayBuffer(iv) },
        key,
        toArrayBuffer(encrypted),
    );

    // Decode as UTF-8 using TextDecoder
    return textDecoder.decode(decrypted);
}

