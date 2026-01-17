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
 * Converts a hex string to a Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a base64 string.
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
 * Imports the encryption key from the environment variable.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set in Convex");
  }
  if (encryptionKey.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)",
    );
  }

  const keyBytes = hexToBytes(encryptionKey);

  // Create a new ArrayBuffer copy to satisfy TypeScript's BufferSource type
  // This avoids SharedArrayBuffer type ambiguity from Uint8Array.buffer
  const keyBuffer = new Uint8Array(keyBytes).buffer as ArrayBuffer;

  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ALGORITHM },
    false, // not extractable
    ["encrypt", "decrypt"],
  );
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
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  // Encrypt (Web Crypto API includes auth tag in the ciphertext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );

  // Combine IV + ciphertext (which includes auth tag)
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

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

  const combined = base64ToBytes(ciphertext);

  // Extract IV and ciphertext (which includes auth tag)
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted,
  );

  // Decode as UTF-8
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
