import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, getById, getMyImages, remove, getByR2Key, getRecent } from "./referenceImages";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: any) => config,
    query: (config: any) => config,
}));

describe("referenceImages", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCtx = {
            auth: {
                getUserIdentity: vi.fn(),
            },
            db: {
                insert: vi.fn().mockResolvedValue("ref123"),
                get: vi.fn(),
                query: vi.fn().mockReturnValue({
                    withIndex: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    paginate: vi.fn().mockResolvedValue({ page: [], isDone: true, continueCursor: "" }),
                    unique: vi.fn(),
                    take: vi.fn().mockResolvedValue([]),
                }),
                delete: vi.fn().mockResolvedValue(undefined),
            },
        };
    });

    describe("create mutation", () => {
        const args = {
            r2Key: "key",
            url: "url",
            filename: "file.jpg",
            contentType: "image/jpeg",
            sizeBytes: 100,
        };

        it("should throw if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            // @ts-ignore
            await expect(create.handler(mockCtx, args)).rejects.toThrow("Not authenticated");
        });

        it("should insert record if authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            // @ts-ignore
            const result = await create.handler(mockCtx, args);
            expect(result).toBe("ref123");
            expect(mockCtx.db.insert).toHaveBeenCalledWith("referenceImages", expect.objectContaining({
                ownerId: "user1",
                r2Key: "key",
            }));
        });
    });

    describe("getById query", () => {
        it("should return null if not owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user2" });
            mockCtx.db.get.mockResolvedValue({ _id: "ref123", ownerId: "user1" });
            // @ts-ignore
            const result = await getById.handler(mockCtx, { imageId: "ref123" as any });
            expect(result).toBeNull();
        });

        it("should return image if owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            const mockImage = { _id: "ref123", ownerId: "user1" };
            mockCtx.db.get.mockResolvedValue(mockImage);
            // @ts-ignore
            const result = await getById.handler(mockCtx, { imageId: "ref123" as any });
            expect(result).toEqual(mockImage);
        });
    });

    describe("getMyImages query", () => {
        it("should paginate for owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            // @ts-ignore
            const result = await getMyImages.handler(mockCtx, { paginationOpts: { numItems: 10, cursor: null } });
            expect(result.page).toEqual([]);
            expect(mockCtx.db.query).toHaveBeenCalledWith("referenceImages");
        });
    });

    describe("remove mutation", () => {
        it("should delete if owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.db.get.mockResolvedValue({ _id: "ref123", ownerId: "user1", r2Key: "key" });
            // @ts-ignore
            const result = await remove.handler(mockCtx, { imageId: "ref123" as any });
            expect(result).toEqual({ r2Key: "key" });
            expect(mockCtx.db.delete).toHaveBeenCalledWith("ref123");
        });

        it("should throw if not owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user2" });
            mockCtx.db.get.mockResolvedValue({ _id: "ref123", ownerId: "user1" });
            // @ts-ignore
            await expect(remove.handler(mockCtx, { imageId: "ref123" as any })).rejects.toThrow("Not authorized");
        });
    });

    describe("getByR2Key query", () => {
        it("should return image only for owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.db.query().unique.mockResolvedValue({ ownerId: "user1", r2Key: "key" });
            // @ts-ignore
            const result = await getByR2Key.handler(mockCtx, { r2Key: "key" });
            expect(result).toBeDefined();

            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user2" });
            // @ts-ignore
            const result2 = await getByR2Key.handler(mockCtx, { r2Key: "key" });
            expect(result2).toBeNull();
        });
    });

    describe("getRecent query", () => {
        it("should take 50 entries for owner", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            // @ts-ignore
            await getRecent.handler(mockCtx, {});
            expect(mockCtx.db.query().take).toHaveBeenCalledWith(50);
        });
    });
});
