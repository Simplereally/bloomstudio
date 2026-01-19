import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserLibrary, isInLibrary, savePrompt, addToLibrary, removeFromLibrary, getPrompt, getCategories } from "./promptLibrary";

// Mock Convex server
vi.mock("./_generated/server", () => ({
    mutation: (config: any) => config,
    query: (config: any) => config,
}));

describe("promptLibrary functions", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.clearAllMocks();

        const mockQuery = {
            withIndex: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            take: vi.fn(),
            first: vi.fn(),
            collect: vi.fn(),
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

        mockCtx.setupQuery = (result: any) => {
            mockQuery.first.mockResolvedValue(result);
            mockQuery.take.mockResolvedValue(Array.isArray(result) ? result : [result]);
            mockQuery.collect.mockResolvedValue(Array.isArray(result) ? result : [result]);
        };
    });

    describe("getUserLibrary", () => {
        it("should return empty array if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            const result = await getUserLibrary.handler(mockCtx, {});
            expect(result).toEqual([]);
        });

        it("should return enriched prompts for the user", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            const mockEntries = [
                { _id: "entry1", promptId: "p1", createdAt: 100 },
                { _id: "entry2", promptId: "p2", createdAt: 200 },
            ];
            mockCtx.setupQuery(mockEntries);

            const mockPrompts = {
                p1: { _id: "p1", title: "T1", type: "positive" },
                p2: { _id: "p2", title: "T2", type: "positive" },
            };
            mockCtx.db.get.mockImplementation((id: string) => Promise.resolve((mockPrompts as any)[id] || null));

            const result = await getUserLibrary.handler(mockCtx, { type: "positive" });

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ title: "T1", libraryEntryId: "entry1", addedAt: 100 });
        });

        it("should filter by type if provided", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            const mockEntries = [
                { _id: "entry1", promptId: "p1", createdAt: 100 },
            ];
            mockCtx.setupQuery(mockEntries);

            mockCtx.db.get.mockResolvedValue({ _id: "p1", title: "T1", type: "negative" });

            const result = await getUserLibrary.handler(mockCtx, { type: "positive" });

            expect(result).toHaveLength(0);
        });
    });

    describe("isInLibrary", () => {
        it("should return false if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            const result = await isInLibrary.handler(mockCtx, { promptId: "p1" as any });
            expect(result).toBe(false);
        });

        it("should return true if entry exists", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "entry1" });
            const result = await isInLibrary.handler(mockCtx, { promptId: "p1" as any });
            expect(result).toBe(true);
        });
    });

    describe("savePrompt", () => {
        it("should throw if not authenticated", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            await expect(savePrompt.handler(mockCtx, { title: "A", content: "B", type: "positive", tags: [] }))
                .rejects.toThrow("Must be authenticated");
        });

        it("should create new prompt if not existing", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery(null); // No existing prompt, no existing entry
            
            mockCtx.db.insert.mockImplementation((table: string) => {
                if (table === "prompts") return "new_p1";
                if (table === "userPromptLibrary") return "entry1";
            });

            const result = await savePrompt.handler(mockCtx, { 
                title: "New Title", 
                content: "Unique Content", 
                type: "positive", 
                tags: ["art"] 
            });

            expect(mockCtx.db.insert).toHaveBeenCalledWith("prompts", expect.objectContaining({
                content: "Unique Content",
                referenceCount: 1,
            }));
            expect(mockCtx.db.insert).toHaveBeenCalledWith("userPromptLibrary", expect.objectContaining({
                userId: "user1",
                promptId: "new_p1",
            }));
            expect(result).toEqual({ promptId: "new_p1", alreadyExists: false });
        });

        it("should reuse existing prompt and increment referenceCount", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            // First call to setupQuery for existingPrompt
            // Second call to setupQuery for existingEntry
            let queryCount = 0;
            mockCtx.db.query = vi.fn(() => ({
                withIndex: vi.fn().mockReturnThis(),
                first: vi.fn(async () => {
                    queryCount++;
                    if (queryCount === 1) return { _id: "p1", referenceCount: 10 }; // Existing prompt
                    if (queryCount === 2) return null; // Not in library
                    return null;
                }),
            }));

            const result = await savePrompt.handler(mockCtx, { 
                title: "Existing", 
                content: "Existing Content", 
                type: "positive", 
                tags: [] 
            });

            expect(mockCtx.db.patch).toHaveBeenCalledWith("p1", { referenceCount: 11 });
            expect(mockCtx.db.insert).toHaveBeenCalledWith("userPromptLibrary", expect.objectContaining({
                promptId: "p1",
            }));
            expect(result).toEqual({ promptId: "p1", alreadyExists: false });
        });

        it("should return alreadyExists: true if already in library", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            
            let queryCount = 0;
            mockCtx.db.query = vi.fn(() => ({
                withIndex: vi.fn().mockReturnThis(),
                first: vi.fn(async () => {
                    queryCount++;
                    if (queryCount === 1) return { _id: "p1", referenceCount: 10 }; // Existing prompt
                    if (queryCount === 2) return { _id: "entry1" }; // Already in library
                    return null;
                }),
            }));

            const result = await savePrompt.handler(mockCtx, { 
                title: "Existing", 
                content: "Existing Content", 
                type: "positive", 
                tags: [] 
            });

            expect(mockCtx.db.insert).not.toHaveBeenCalled();
            expect(result).toEqual({ promptId: "p1", alreadyExists: true });
        });
    });

    describe("addToLibrary", () => {
        it("should increment referenceCount and add entry", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.db.get.mockResolvedValue({ _id: "p1", referenceCount: 5 });
            mockCtx.setupQuery(null); // Not in library

            const result = await addToLibrary.handler(mockCtx, { promptId: "p1" as any });

            expect(mockCtx.db.patch).toHaveBeenCalledWith("p1", { referenceCount: 6 });
            expect(mockCtx.db.insert).toHaveBeenCalledWith("userPromptLibrary", expect.objectContaining({
                promptId: "p1",
            }));
            expect(result).toEqual({ alreadyExists: false });
        });
    });

    describe("removeFromLibrary", () => {
        it("should decrement referenceCount if other references exist", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "entry1", promptId: "p1" });
            mockCtx.db.get.mockResolvedValue({ _id: "p1", referenceCount: 2 });

            const result = await removeFromLibrary.handler(mockCtx, { promptId: "p1" as any });

            expect(mockCtx.db.delete).toHaveBeenCalledWith("entry1");
            expect(mockCtx.db.patch).toHaveBeenCalledWith("p1", { referenceCount: 1 });
            expect(mockCtx.db.delete).not.toHaveBeenCalledWith("p1");
            expect(result).toEqual({ deleted: true });
        });

        it("should delete prompt if it was the last reference", async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue({ subject: "user1" });
            mockCtx.setupQuery({ _id: "entry1", promptId: "p1" });
            mockCtx.db.get.mockResolvedValue({ _id: "p1", referenceCount: 1 });

            await removeFromLibrary.handler(mockCtx, { promptId: "p1" as any });

            expect(mockCtx.db.delete).toHaveBeenCalledWith("entry1");
            expect(mockCtx.db.delete).toHaveBeenCalledWith("p1");
        });
    });

    describe("getCategories", () => {
        it("should return unique sorted categories", async () => {
            mockCtx.setupQuery([
                { category: "Z" },
                { category: "A" },
                { category: "A" },
                { title: "No category" },
            ]);

            const result = await getCategories.handler(mockCtx, {});

            expect(result).toEqual(["A", "Z"]);
        });
    });
});
