import { describe, it, expect, vi, beforeEach } from "vitest";
import { follow, unfollow, isFollowing, getFollowStats } from "./follows";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: any) => config,
    query: (config: any) => config,
}));

describe("follows functions", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        const mockQuery = {
            withIndex: vi.fn().mockReturnThis(),
            unique: vi.fn(),
        };

        mockCtx = {
            auth: {
                getUserIdentity: vi.fn(),
            },
            db: {
                query: vi.fn(() => mockQuery),
                insert: vi.fn(),
                patch: vi.fn(),
                delete: vi.fn(),
            },
        };

        mockCtx.setupQuery = (result: any) => {
            mockQuery.unique.mockResolvedValue(result);
        };
    });

    describe("follow", () => {
        it("should throw if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            await expect(follow.handler(mockCtx, { followeeId: "user2" }))
                .rejects.toThrow("Not authenticated");
        });

        it("should throw if following self", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            await expect(follow.handler(mockCtx, { followeeId: "user1" }))
                .rejects.toThrow("Cannot follow yourself");
        });

        it("should do nothing if already following", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "follow1" });

            await follow.handler(mockCtx, { followeeId: "user2" });

            expect(mockCtx.db.insert).not.toHaveBeenCalled();
        });

        it("should create follow and update counts", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            // First query: check if follow exists (null)
            // Second query: get follower (user1)
            // Third query: get followee (user2)
            let queryCount = 0;
            mockCtx.db.query = vi.fn(() => ({
                withIndex: vi.fn().mockReturnThis(),
                unique: vi.fn(async () => {
                    queryCount++;
                    if (queryCount === 1) return null; // follow check
                    if (queryCount === 2) return { _id: "u1", clerkId: "user1", followingCount: 5 }; // follower
                    if (queryCount === 3) return { _id: "u2", clerkId: "user2", followersCount: 10 }; // followee
                    return null;
                }),
            }));

            await follow.handler(mockCtx, { followeeId: "user2" });

            expect(mockCtx.db.insert).toHaveBeenCalledWith("follows", expect.objectContaining({
                followerId: "user1",
                followeeId: "user2",
            }));
            expect(mockCtx.db.patch).toHaveBeenCalledWith("u1", { followingCount: 6 });
            expect(mockCtx.db.patch).toHaveBeenCalledWith("u2", { followersCount: 11 });
        });
    });

    describe("unfollow", () => {
        it("should throw if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            await expect(unfollow.handler(mockCtx, { followeeId: "user2" }))
                .rejects.toThrow("Not authenticated");
        });

        it("should do nothing if not following", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery(null);

            await unfollow.handler(mockCtx, { followeeId: "user2" });

            expect(mockCtx.db.delete).not.toHaveBeenCalled();
        });

        it("should remove follow and update counts", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            let queryCount = 0;
            mockCtx.db.query = vi.fn(() => ({
                withIndex: vi.fn().mockReturnThis(),
                unique: vi.fn(async () => {
                    queryCount++;
                    if (queryCount === 1) return { _id: "follow1" }; // follow check
                    if (queryCount === 2) return { _id: "u1", clerkId: "user1", followingCount: 5 }; // follower
                    if (queryCount === 3) return { _id: "u2", clerkId: "user2", followersCount: 10 }; // followee
                    return null;
                }),
            }));

            await unfollow.handler(mockCtx, { followeeId: "user2" });

            expect(mockCtx.db.delete).toHaveBeenCalledWith("follow1");
            expect(mockCtx.db.patch).toHaveBeenCalledWith("u1", { followingCount: 4 });
            expect(mockCtx.db.patch).toHaveBeenCalledWith("u2", { followersCount: 9 });
        });
    });

    describe("isFollowing", () => {
        it("should return false if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            const result = await isFollowing.handler(mockCtx, { followeeId: "user2" });
            expect(result).toBe(false);
        });

        it("should return true if following", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "follow1" });
            const result = await isFollowing.handler(mockCtx, { followeeId: "user2" });
            expect(result).toBe(true);
        });
    });

    describe("getFollowStats", () => {
        it("should return zero stats if user not found", async () => {
            mockCtx.setupQuery(null);
            const result = await getFollowStats.handler(mockCtx, { userId: "user1" });
            expect(result).toEqual({ followers: 0, following: 0 });
        });

        it("should return user stats", async () => {
            mockCtx.setupQuery({ followersCount: 100, followingCount: 50 });
            const result = await getFollowStats.handler(mockCtx, { userId: "user1" });
            expect(result).toEqual({ followers: 100, following: 50 });
        });
    });
});
