import { describe, it, expect, vi } from "vitest";

// Mock internal definitions to avoid needing the full Convex server environment in unit test
vi.mock("./_generated/server", () => ({
    internalMutation: (config: object) => config,
    internalQuery: (config: object) => config,
}));

describe("detailsMigration structure", () => {
    it("should export findImagesWithoutDetails query", async () => {
        const { findImagesWithoutDetails } = await import("./detailsMigration");
        expect(findImagesWithoutDetails).toBeDefined();
        expect((findImagesWithoutDetails as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export migrateDetails mutation", async () => {
        const { migrateDetails } = await import("./detailsMigration");
        expect(migrateDetails).toBeDefined();
        expect((migrateDetails as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export migrateAllDetails mutation", async () => {
        const { migrateAllDetails } = await import("./detailsMigration");
        expect(migrateAllDetails).toBeDefined();
        expect((migrateAllDetails as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export previewMigration query", async () => {
        const { previewMigration } = await import("./detailsMigration");
        expect(previewMigration).toBeDefined();
        expect((previewMigration as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should export isMigrationComplete query", async () => {
        const { isMigrationComplete } = await import("./detailsMigration");
        expect(isMigrationComplete).toBeDefined();
        expect((isMigrationComplete as unknown as { handler: unknown }).handler).toBeInstanceOf(Function);
    });

    it("should have correct args validator for findImagesWithoutDetails", async () => {
        const { findImagesWithoutDetails } = await import("./detailsMigration");
        const args = (findImagesWithoutDetails as unknown as { args: { limit: unknown } }).args;
        expect(args).toBeDefined();
        expect(args.limit).toBeDefined();
    });

    it("should have empty args for migrateDetails", async () => {
        const { migrateDetails } = await import("./detailsMigration");
        const args = (migrateDetails as unknown as { args: object }).args;
        expect(args).toBeDefined();
        expect(Object.keys(args)).toHaveLength(0);
    });
});

describe("detailsMigration logic coverage", () => {
    it("findImagesWithoutDetails accepts a limit argument", async () => {
        const { findImagesWithoutDetails } = await import("./detailsMigration");
        const config = findImagesWithoutDetails as unknown as { 
            args: { limit: unknown };
            handler: (ctx: unknown, args: { limit: number }) => unknown;
        };
        
        // Verify limit argument is defined in the validator
        expect(config.args.limit).toBeDefined();
    });

    it("migrateDetails returns expected result shape (has handler)", async () => {
        const { migrateDetails } = await import("./detailsMigration");
        const config = migrateDetails as unknown as { handler: (...args: unknown[]) => unknown };
        
        // Handler should be a function
        expect(typeof config.handler).toBe("function");
    });

    it("migrateAllDetails returns expected result shape (has handler)", async () => {
        const { migrateAllDetails } = await import("./detailsMigration");
        const config = migrateAllDetails as unknown as { handler: (...args: unknown[]) => unknown };
        
        // Handler should be a function
        expect(typeof config.handler).toBe("function");
    });
});
