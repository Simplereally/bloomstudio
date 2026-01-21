import { describe, it, expect } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import {
    MAX_BATCH_SIZE,
    MIN_BATCH_SIZE,
    BASE_RATE_LIMIT_DELAY_MS,
    MIN_JITTER_MS,
    MAX_JITTER_MS,
    toBatchJobSummary,
    generationParamsValidator,
    storeGeneratedImageArgsValidator,
    type BatchJobSummary,
} from "./batchTypes";

describe("batchTypes constants", () => {
    it("should export MAX_BATCH_SIZE as 1000", () => {
        expect(MAX_BATCH_SIZE).toBe(1000);
    });

    it("should export MIN_BATCH_SIZE as 1", () => {
        expect(MIN_BATCH_SIZE).toBe(1);
    });

    it("should export BASE_RATE_LIMIT_DELAY_MS as 100", () => {
        expect(BASE_RATE_LIMIT_DELAY_MS).toBe(100);
    });

    it("should export jitter constants", () => {
        expect(MIN_JITTER_MS).toBe(20);
        expect(MAX_JITTER_MS).toBe(100);
    });
});

describe("toBatchJobSummary", () => {
    it("should convert a full batch job to a summary", () => {
        const fullJob: Doc<"batchJobs"> = {
            _id: "test_id" as Id<"batchJobs">,
            _creationTime: 1234567890,
            ownerId: "user_123",
            status: "processing",
            totalCount: 10,
            completedCount: 5,
            failedCount: 1,
            currentIndex: 6,
            inFlightCount: 2,
            generationParams: { prompt: "test", width: 1024, height: 1024 },
            apiKey: "secret_key_should_be_stripped",
            imageIds: ["img1" as Id<"generatedImages">, "img2" as Id<"generatedImages">],
            createdAt: 1234567890,
            updatedAt: 1234567900,
            lastErrorCode: 429,
        };

        const summary = toBatchJobSummary(fullJob);

        // Verify included fields
        expect(summary._id).toBe("test_id");
        expect(summary._creationTime).toBe(1234567890);
        expect(summary.status).toBe("processing");
        expect(summary.totalCount).toBe(10);
        expect(summary.completedCount).toBe(5);
        expect(summary.failedCount).toBe(1);
        expect(summary.currentIndex).toBe(6);
        expect(summary.inFlightCount).toBe(2);
        expect(summary.createdAt).toBe(1234567890);
        expect(summary.updatedAt).toBe(1234567900);
        expect(summary.lastErrorCode).toBe(429);

        // Verify excluded fields (using type assertion to check they're not in the result)
        const summaryAsRecord = summary as Record<string, unknown>;
        expect(summaryAsRecord.apiKey).toBeUndefined();
        expect(summaryAsRecord.generationParams).toBeUndefined();
        expect(summaryAsRecord.imageIds).toBeUndefined();
        expect(summaryAsRecord.ownerId).toBeUndefined();
    });

    it("should handle optional fields being undefined", () => {
        const minimalJob: Doc<"batchJobs"> = {
            _id: "test_id" as Id<"batchJobs">,
            _creationTime: 1234567890,
            ownerId: "user_123",
            status: "pending",
            totalCount: 5,
            completedCount: 0,
            failedCount: 0,
            currentIndex: 0,
            generationParams: { prompt: "test" },
            imageIds: [],
            createdAt: 1234567890,
            updatedAt: 1234567890,
        };

        const summary = toBatchJobSummary(minimalJob);

        expect(summary.inFlightCount).toBeUndefined();
        expect(summary.lastErrorCode).toBeUndefined();
    });
});

describe("generationParamsValidator", () => {
    it("should be a Convex validator object", () => {
        expect(generationParamsValidator).toBeDefined();
        expect(typeof generationParamsValidator).toBe("object");
    });
});

describe("storeGeneratedImageArgsValidator", () => {
    it("should have all required fields", () => {
        expect(storeGeneratedImageArgsValidator.ownerId).toBeDefined();
        expect(storeGeneratedImageArgsValidator.r2Key).toBeDefined();
        expect(storeGeneratedImageArgsValidator.url).toBeDefined();
        expect(storeGeneratedImageArgsValidator.prompt).toBeDefined();
        expect(storeGeneratedImageArgsValidator.width).toBeDefined();
        expect(storeGeneratedImageArgsValidator.height).toBeDefined();
        expect(storeGeneratedImageArgsValidator.model).toBeDefined();
        expect(storeGeneratedImageArgsValidator.contentType).toBeDefined();
        expect(storeGeneratedImageArgsValidator.sizeBytes).toBeDefined();
        expect(storeGeneratedImageArgsValidator.generationParams).toBeDefined();
        expect(storeGeneratedImageArgsValidator.visibility).toBeDefined();
    });

    it("should have optional thumbnail/preview fields", () => {
        expect(storeGeneratedImageArgsValidator.thumbnailR2Key).toBeDefined();
        expect(storeGeneratedImageArgsValidator.thumbnailUrl).toBeDefined();
        expect(storeGeneratedImageArgsValidator.previewR2Key).toBeDefined();
        expect(storeGeneratedImageArgsValidator.previewUrl).toBeDefined();
        expect(storeGeneratedImageArgsValidator.seed).toBeDefined();
    });
});

describe("BatchJobSummary type", () => {
    it("should be usable as a type", () => {
        // This is a compile-time check - if the type is broken, this won't compile
        const summary: BatchJobSummary = {
            _id: "test" as Id<"batchJobs">,
            _creationTime: 0,
            status: "pending",
            totalCount: 1,
            completedCount: 0,
            failedCount: 0,
            currentIndex: 0,
            createdAt: 0,
            updatedAt: 0,
        };
        expect(summary).toBeDefined();
    });
});
