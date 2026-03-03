import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AWS S3 Client
vi.mock("@aws-sdk/client-s3", () => {
  const mockSend = vi.fn();
  const S3Client = vi.fn(function() {
    return { send: mockSend };
  });
  // Attach mockSend to S3Client so we can access it in tests
  (S3Client as any).mockSend = mockSend;

  return {
    S3Client,
    PutObjectCommand: vi.fn(function(args) { return { ...args, commandType: "PutObject" }; }),
    DeleteObjectCommand: vi.fn(function(args) { return { ...args, commandType: "DeleteObject" }; }),
    DeleteObjectsCommand: vi.fn(function(args) { return { ...args, commandType: "DeleteObjects" }; }),
    HeadObjectCommand: vi.fn(function(args) { return { ...args, commandType: "HeadObject" }; }),
  };
});

import { S3Client } from "@aws-sdk/client-s3";
const mockS3Client = S3Client as unknown as ReturnType<typeof vi.fn>;
const mockSend = (S3Client as any).mockSend;

// Mock process.env
const originalEnv = process.env;

// Mock retry mechanism
vi.mock("./retry", () => ({
  withRetry: (fn: Function) => fn(),
  isRetryableError: vi.fn(),
}));

// Spy on crypto methods for deterministic test values
import crypto from "crypto";
const mockRandomUUID = vi.spyOn(crypto, "randomUUID").mockReturnValue("mock-uuid" as `${string}-${string}-${string}-${string}-${string}`);
const mockCreateHash = vi.spyOn(crypto, "createHash").mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue("mock-user-hash"),
} as unknown as crypto.Hash);

import {
  uploadImage,
  deleteImage,
  deleteImages,
  imageExists,
  generateImageKey,
  getPublicUrl,
  _resetClient,
} from "./r2-client";

describe("r2-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetClient();
    process.env = {
      ...originalEnv,
      R2_ACCOUNT_ID: "mock-account-id",
      R2_ACCESS_KEY_ID: "mock-access-key",
      R2_SECRET_ACCESS_KEY: "mock-secret-key",
      R2_BUCKET_NAME: "mock-bucket",
      R2_PUBLIC_URL: "https://pub.url",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("uploadImage", () => {
    it("should upload an image successfully", async () => {
      mockSend.mockResolvedValueOnce({});
      const data = Buffer.from("test-image-data");
      const result = await uploadImage({
        data,
        contentType: "image/png",
        key: "test-key.png",
      });

      expect(mockS3Client).toHaveBeenCalledWith(expect.objectContaining({
          region: "auto",
          endpoint: "https://mock-account-id.r2.cloudflarestorage.com",
      }));

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        commandType: "PutObject",
        Bucket: "mock-bucket",
        Key: "test-key.png",
        Body: data,
        ContentType: "image/png",
      }));

      expect(result).toEqual({
        key: "test-key.png",
        url: "https://pub.url/test-key.png",
        sizeBytes: data.length,
      });
    });

    it("should throw error if env vars are missing", async () => {
      delete process.env.R2_ACCOUNT_ID;
      await expect(uploadImage({
        data: Buffer.from(""),
        contentType: "image/png",
        key: "key",
      })).rejects.toThrow("Missing required environment variable: R2_ACCOUNT_ID");
    });
  });

  describe("deleteImage", () => {
    it("should delete an image", async () => {
      mockSend.mockResolvedValueOnce({});
      await deleteImage("test-key.png");

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        commandType: "DeleteObject",
        Bucket: "mock-bucket",
        Key: "test-key.png",
      }));
    });
  });

  describe("deleteImages", () => {
    it("should delete multiple images", async () => {
      mockSend.mockResolvedValueOnce({});
      await deleteImages(["key1", "key2"]);

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        commandType: "DeleteObjects",
        Bucket: "mock-bucket",
        Delete: {
          Objects: [{ Key: "key1" }, { Key: "key2" }],
          Quiet: true,
        },
      }));
    });

    it("should do nothing if keys array is empty", async () => {
      await deleteImages([]);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should batch deletions (mock logic check)", async () => {
        // This specifically tests the batching logic inside deleteImages
        // We create an array larger than 1000 items (the batch size)
        const keys = Array.from({ length: 1500 }, (_, i) => `key${i}`);
        
        mockSend.mockResolvedValue({}); // Resolve all calls

        await deleteImages(keys);

        // Should be called twice: once for 1000, once for 500
        expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe("imageExists", () => {
    it("should return true if head object succeeds", async () => {
      mockSend.mockResolvedValueOnce({});
      const exists = await imageExists("test-key.png");
      expect(exists).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
          commandType: "HeadObject",
          Bucket: "mock-bucket",
          Key: "test-key.png",
      }));
    });

    it("should return false if head object throws", async () => {
      mockSend.mockRejectedValueOnce(new Error("Not found"));
      const exists = await imageExists("test-key.png");
      expect(exists).toBe(false);
    });
  });

  describe("generateImageKey", () => {
    it("should generate a correct key structure", () => {
      const key = generateImageKey("user123", "generated", "image/png");
      // Format: {type}/{userHash}/{timestamp}-{randomId}.{ext}
      // userHash for "user123" mocked to "mock-user-hash"
      // randomUUID mocked to "mock-uuid"
      expect(key).toMatch(/^generated\/mock-user-hash\/\d+-mock-uuid\.png$/);
    });
  });

  describe("getPublicUrl", () => {
    it("should return the correct public URL", () => {
      const url = getPublicUrl("path/to/image.png");
      expect(url).toBe("https://pub.url/path/to/image.png");
    });
  });
});
