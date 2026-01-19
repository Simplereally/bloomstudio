import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggle, isFavorited, list, batchIsFavorited } from "./favorites";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: any) => config,
    query: (config: any) => config,
}));

describe("favorites functions", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        const mockQuery = {
            withIndex: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            paginate: vi.fn(),
            unique: vi.fn(),
        };

        mockCtx = {
            auth: {
                getUserIdentity: vi.fn(),
            },
            db: {
                query: vi.fn(() => mockQuery),
                get: vi.fn(),
                insert: vi.fn(),
                patch: vi.fn(),
                delete: vi.fn(),
            },
        };

        // Helper to simplify mock setup
        mockCtx.setupQuery = (result: any) => {
            mockQuery.unique.mockResolvedValue(result);
            mockQuery.paginate.mockResolvedValue(result);
        };
    });

    describe("toggle", () => {
        it("should throw if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            await expect(toggle.handler(mockCtx, { imageId: "img1" as any }))
                .rejects.toThrow("Not authenticated");
        });

        it("should remove favorite if it exists", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "fav1" });

            const result = await toggle.handler(mockCtx, { imageId: "img1" as any });

            expect(mockCtx.db.delete).toHaveBeenCalledWith("fav1");
            expect(result).toEqual({ favorited: false });
        });

        it("should add favorite if it does not exist", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery(null);

            const result = await toggle.handler(mockCtx, { imageId: "img1" as any });

            expect(mockCtx.db.insert).toHaveBeenCalledWith("favorites", expect.objectContaining({
                userId: "user1",
                imageId: "img1",
            }));
            expect(result).toEqual({ favorited: true });
        });
    });

    describe("isFavorited", () => {
        it("should return false if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            const result = await isFavorited.handler(mockCtx, { imageId: "img1" as any });
            expect(result).toBe(false);
        });

        it("should return true if favorite exists", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "fav1" });
            const result = await isFavorited.handler(mockCtx, { imageId: "img1" as any });
            expect(result).toBe(true);
        });

        it("should return false if favorite does not exist", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery(null);
            const result = await isFavorited.handler(mockCtx, { imageId: "img1" as any });
            expect(result).toBe(false);
        });
    });

    describe("list", () => {
        it("should return empty page if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            const result = await list.handler(mockCtx, { paginationOpts: { numItems: 10, cursor: null } });
            expect(result.page).toHaveLength(0);
            expect(result.isDone).toBe(true);
        });

        it("should return enriched images", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            const mockFavorites = {
                page: [{ imageId: "img1" }, { imageId: "img2" }],
                isDone: true,
                continueCursor: "",
            };
            mockCtx.setupQuery(mockFavorites);

            const mockImages = [
                { _id: "img1", ownerId: "owner1", prompt: "p1" },
                { _id: "img2", ownerId: "owner2", prompt: "p2" },
            ];
            mockCtx.db.get.mockImplementation((id: string) => {
                return Promise.resolve(mockImages.find(img => img._id === id) || null);
            });

            // Mock user lookup for enrichment
            const mockUsers = [
                { clerkId: "owner1", username: "user_one", pictureUrl: "pic1" },
                { clerkId: "owner2", username: "user_two", pictureUrl: "pic2" },
            ];
            
            // We need to mock the enrichment query which uses ctx.db.query("users")...
            // The enrichImages function does mappings...
            
            // Let's refine the mock to handle multiple queries
            mockCtx.db.query.mockImplementation((table: string) => {
                return {
                    withIndex: vi.fn().mockReturnThis(),
                    unique: vi.fn(async () => {
                        if (table === "users") {
                            // This is a bit simplified, but covers the logic
                            return mockUsers.shift() || null;
                        }
                        return null;
                    }),
                    order: vi.fn().mockReturnThis(),
                    paginate: vi.fn().mockResolvedValue(mockFavorites),
                };
            });

            const result = await list.handler(mockCtx, { paginationOpts: { numItems: 10, cursor: null } });

            expect(result.page).toHaveLength(2);
            expect(result.page[0]).toMatchObject({
                _id: "img1",
                ownerName: "user_one",
                ownerPictureUrl: "pic1",
            });
        });
    });

    describe("batchIsFavorited", () => {
        it("should return empty object if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            const result = await batchIsFavorited.handler(mockCtx, { imageIds: ["img1" as any] });
            expect(result).toEqual({});
        });

        it("should return map of favorite status", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            // Toggle between returning a favorite and null
            let toggle = true;
            mockCtx.db.query = vi.fn(() => ({
                withIndex: vi.fn().mockReturnThis(),
                unique: vi.fn(async () => {
                    const result = toggle ? { _id: "fav" } : null;
                    toggle = !toggle;
                    return result;
                }),
            }));

            const result = await batchIsFavorited.handler(mockCtx, { 
                imageIds: ["img1", "img2"] as any 
            });

            expect(result).toEqual({
                img1: true,
                img2: false,
            });
        });
    });
});
