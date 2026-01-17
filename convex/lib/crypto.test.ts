
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('crypto', () => {
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    it('transforms valid hex key correctly', async () => {
        // 32 bytes = 64 hex chars
        const validKey = '0'.repeat(64);
        process.env.ENCRYPTION_KEY = validKey;
        const { encryptApiKey, decryptApiKey } = await import('./crypto');

        const encrypted = await encryptApiKey('test-key');
        expect(encrypted).toBeDefined();
        const decrypted = await decryptApiKey(encrypted);
        expect(decrypted).toBe('test-key');
    });

    it('fails with short key', async () => {
        process.env.ENCRYPTION_KEY = 'abc';
        // Re-import to ensure fresh module state (reset cachedKey)
        const { encryptApiKey } = await import('./crypto');

        await expect(encryptApiKey('test')).rejects.toThrow(/ENCRYPTION_KEY must be exactly 64 hex characters/);
    });

    it('fails with invalid hex chars in key', async () => {
        // 63 chars of '0' and 1 'z' = 64 chars
        const invalidKey = '0'.repeat(63) + 'z';
        process.env.ENCRYPTION_KEY = invalidKey;

        // Re-import to ensure fresh module state (reset cachedKey)
        const { encryptApiKey } = await import('./crypto');

        // Should now throw explicit error from getEncryptionKey validation
        await expect(encryptApiKey('test')).rejects.toThrow(/ENCRYPTION_KEY contains invalid hex characters/);
    });
});
