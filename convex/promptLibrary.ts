/**
 * Prompt Library - Convex functions for managing user prompt libraries
 *
 * This module handles:
 * - Searching prompts with full-text search
 * - Saving prompts (with deduplication)
 * - Adding/removing prompts from user libraries
 * - Listing user's saved prompts
 */

import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

/**
 * Generate a simple hash for content deduplication
 * Uses a basic string hash - sufficient for duplicate detection
 */
function hashContent(content: string): string {
    let hash = 0
    const normalizedContent = content.trim().toLowerCase()
    for (let i = 0; i < normalizedContent.length; i++) {
        const char = normalizedContent.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(36)
}

/**
 * Get user's saved prompts from their library
 */
export const getUserLibrary = query({
    args: {
        type: v.optional(v.union(v.literal("positive"), v.literal("negative"))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        const userId = identity.subject
        const limit = args.limit ?? 50

        // Get user's library entries
        const libraryEntries = await ctx.db
            .query("userPromptLibrary")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(limit)

        // Fetch the actual prompts
        const prompts = await Promise.all(
            libraryEntries.map(async (entry) => {
                const prompt = await ctx.db.get(entry.promptId)
                if (!prompt) return null
                if (args.type && prompt.type !== args.type) return null
                return {
                    ...prompt,
                    libraryEntryId: entry._id,
                    addedAt: entry.createdAt,
                }
            })
        )

        return prompts.filter(Boolean)
    },
})

/**
 * Check if a prompt is in the user's library
 */
export const isInLibrary = query({
    args: {
        promptId: v.id("prompts"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return false
        }

        const userId = identity.subject
        const entry = await ctx.db
            .query("userPromptLibrary")
            .withIndex("by_user_prompt", (q) =>
                q.eq("userId", userId).eq("promptId", args.promptId)
            )
            .first()

        return entry !== null
    },
})

/**
 * Save a new prompt and add it to user's library
 * If identical prompt exists, just add to library
 */
export const savePrompt = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        type: v.union(v.literal("positive"), v.literal("negative")),
        tags: v.array(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Must be authenticated to save prompts")
        }

        const userId = identity.subject
        const contentHash = hashContent(args.content)

        // Check if identical prompt already exists
        const existingPrompt = await ctx.db
            .query("prompts")
            .withIndex("by_content_hash", (q) => q.eq("contentHash", contentHash))
            .first()

        let promptId: Id<"prompts">

        if (existingPrompt) {
            promptId = existingPrompt._id

            // Check if already in user's library
            const existingEntry = await ctx.db
                .query("userPromptLibrary")
                .withIndex("by_user_prompt", (q) =>
                    q.eq("userId", userId).eq("promptId", promptId)
                )
                .first()

            if (existingEntry) {
                // Already in library, return the prompt
                return { promptId, alreadyExists: true }
            }

            // Increment reference count
            await ctx.db.patch(promptId, {
                referenceCount: existingPrompt.referenceCount + 1,
            })
        } else {
            // Create new prompt
            const normalizedTags = args.tags.map((tag) =>
                tag.trim().toLowerCase()
            )

            promptId = await ctx.db.insert("prompts", {
                title: args.title.trim(),
                content: args.content.trim(),
                type: args.type,
                tags: normalizedTags,
                category: args.category?.trim(),
                contentHash,
                referenceCount: 1,
                createdAt: Date.now(),
            })
        }

        // Add to user's library
        await ctx.db.insert("userPromptLibrary", {
            userId,
            promptId,
            createdAt: Date.now(),
        })

        return { promptId, alreadyExists: false }
    },
})

/**
 * Add an existing prompt to user's library
 */
export const addToLibrary = mutation({
    args: {
        promptId: v.id("prompts"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Must be authenticated to add prompts to library")
        }

        const userId = identity.subject

        // Check if prompt exists
        const prompt = await ctx.db.get(args.promptId)
        if (!prompt) {
            throw new Error("Prompt not found")
        }

        // Check if already in library
        const existingEntry = await ctx.db
            .query("userPromptLibrary")
            .withIndex("by_user_prompt", (q) =>
                q.eq("userId", userId).eq("promptId", args.promptId)
            )
            .first()

        if (existingEntry) {
            return { alreadyExists: true }
        }

        // Increment reference count
        await ctx.db.patch(args.promptId, {
            referenceCount: prompt.referenceCount + 1,
        })

        // Add to library
        await ctx.db.insert("userPromptLibrary", {
            userId,
            promptId: args.promptId,
            createdAt: Date.now(),
        })

        return { alreadyExists: false }
    },
})

/**
 * Remove a prompt from user's library
 * If user is the only reference, delete the prompt entirely
 */
export const removeFromLibrary = mutation({
    args: {
        promptId: v.id("prompts"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Must be authenticated to remove prompts from library")
        }

        const userId = identity.subject

        // Find the library entry
        const entry = await ctx.db
            .query("userPromptLibrary")
            .withIndex("by_user_prompt", (q) =>
                q.eq("userId", userId).eq("promptId", args.promptId)
            )
            .first()

        if (!entry) {
            throw new Error("Prompt not in your library")
        }

        // Delete the library entry
        await ctx.db.delete(entry._id)

        // Get the prompt and decrement reference count
        const prompt = await ctx.db.get(args.promptId)
        if (prompt) {
            if (prompt.referenceCount <= 1) {
                // Last reference, delete the prompt
                await ctx.db.delete(args.promptId)
            } else {
                // Decrement reference count
                await ctx.db.patch(args.promptId, {
                    referenceCount: prompt.referenceCount - 1,
                })
            }
        }

        return { deleted: true }
    },
})

/**
 * Get a single prompt by ID
 */
export const getPrompt = query({
    args: {
        promptId: v.id("prompts"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.promptId)
    },
})

/**
 * Get all unique categories from prompts
 */
export const getCategories = query({
    args: {},
    handler: async (ctx) => {
        const prompts = await ctx.db.query("prompts").collect()
        const categories = new Set<string>()

        for (const prompt of prompts) {
            if (prompt.category) {
                categories.add(prompt.category)
            }
        }

        return Array.from(categories).sort()
    },
})
