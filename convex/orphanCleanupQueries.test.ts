import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllR2Keys } from "./orphanCleanupQueries";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    internalQuery: (config: any) => config,
}));

describe("orphanCleanupQueries", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        const mockQuery = {
            collect: vi.fn(),
        };

        mockCtx = {
            db: {
                query: vi.fn(() => mockQuery),
            },
        };

        mockCtx.setupQuery = (table: string, result: any[]) => {
            mockCtx.db.query.mockImplementation((tableName: string) => {
                if (tableName === table) {
                    return {
                        collect: vi.fn().mockResolvedValue(result),
                    };
                }
                return {
                    collect: vi.fn().mockResolvedValue([]),
                };
            });
        };
    });

    describe("getAllR2Keys", () => {
        it("should return empty array when no images exist", async () => {
            mockCtx.db.query.mockReturnValue({ collect: vi.fn().mockResolvedValue([]) });
            
            const result = await getAllR2Keys.handler(mockCtx, {});
            
            expect(result).toEqual([]);
        });

        it("should collect r2Keys and thumbnailR2Keys from generatedImages", async () => {
            const mockGeneratedImages = [
                { r2Key: "gen/key1.jpg", thumbnailR2Key: "thumb/key1.jpg" },
                { r2Key: "gen/key2.jpg", thumbnailR2Key: null },
            ];
            
            mockCtx.db.query.mockImplementation((tableName: string) => {
                if (tableName === "generatedImages") {
                    return { collect: vi.fn().mockResolvedValue(mockGeneratedImages) };
                }
                return { collect: vi.fn().mockResolvedValue([]) }; // referenceImages
            });

            const result = await getAllR2Keys.handler(mockCtx, {});

            expect(result).toContain("gen/key1.jpg");
            expect(result).toContain("thumb/key1.jpg");
            expect(result).toContain("gen/key2.jpg");
            expect(result).toHaveLength(3);
        });

        it("should collect r2Keys from referenceImages", async () => {
             const mockReferenceImages = [
                { r2Key: "ref/key1.jpg" },
            ];

            mockCtx.db.query.mockImplementation((tableName: string) => {
                if (tableName === "referenceImages") {
                    return { collect: vi.fn().mockResolvedValue(mockReferenceImages) };
                }
                return { collect: vi.fn().mockResolvedValue([]) }; // generatedImages
            });

            const result = await getAllR2Keys.handler(mockCtx, {});

            expect(result).toContain("ref/key1.jpg");
            expect(result).toHaveLength(1);
        });

        it("should collect from both tables", async () => {
            mockCtx.db.query.mockImplementation((tableName: string) => {
                if (tableName === "generatedImages") {
                    return { collect: vi.fn().mockResolvedValue([{ r2Key: "gen1" }]) };
                }
                if (tableName === "referenceImages") {
                    return { collect: vi.fn().mockResolvedValue([{ r2Key: "ref1" }]) };
                }
                return { collect: vi.fn().mockResolvedValue([]) };
            });

            const result = await getAllR2Keys.handler(mockCtx, {});

            expect(result).toContain("gen1");
            expect(result).toContain("ref1");
            expect(result).toHaveLength(2);
        });
    });
});
