/**
 * Secondary Assets
 *
 * Convex control-plane helpers for post-generation video derivatives.
 * The worker plane owns execution; Convex owns lifecycle state and final URLs.
 */

import { v } from "convex/values"
import { internalMutation, internalQuery } from "./_generated/server"

const secondaryAssetsDispatchStatusValidator = v.union(
    v.literal("pending"),
    v.literal("dispatched"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
)

export const updateSecondaryAssets = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        thumbnailR2Key: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        previewR2Key: v.optional(v.string()),
        previewUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            console.warn(`[SecondaryAssets] Image ${args.imageId} not found (may have been deleted), skipping patch`)
            return
        }

        const updates: Record<string, string> = {}

        if (args.thumbnailR2Key !== undefined) {
            updates.thumbnailR2Key = args.thumbnailR2Key
        }
        if (args.thumbnailUrl !== undefined) {
            updates.thumbnailUrl = args.thumbnailUrl
        }
        if (args.previewR2Key !== undefined) {
            updates.previewR2Key = args.previewR2Key
        }
        if (args.previewUrl !== undefined) {
            updates.previewUrl = args.previewUrl
        }

        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(args.imageId, updates)
        }
    },
})

export const getSecondaryAssetsJobInternal = internalQuery({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.imageId)
    },
})

export const markSecondaryAssetsDispatched = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
    },
    returns: v.object({
        dispatched: v.boolean(),
        dispatchAttempts: v.number(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image || !image.contentType.startsWith("video/")) {
            return { dispatched: false, dispatchAttempts: 0 }
        }

        if (image.secondaryAssetsDispatchStatus === "completed" || image.secondaryAssetsDispatchStatus === "cancelled") {
            return {
                dispatched: false,
                dispatchAttempts: image.secondaryAssetsDispatchAttempts ?? 0,
            }
        }

        if (
            image.secondaryAssetsDispatchStatus === "dispatched" ||
            image.secondaryAssetsDispatchStatus === "processing"
        ) {
            return {
                dispatched: false,
                dispatchAttempts: image.secondaryAssetsDispatchAttempts ?? 0,
            }
        }

        const nextAttempts = (image.secondaryAssetsDispatchAttempts ?? 0) + 1
        await ctx.db.patch(args.imageId, {
            secondaryAssetsDispatchStatus: "dispatched",
            secondaryAssetsDispatchAttempts: nextAttempts,
            secondaryAssetsDispatchedAt: Date.now(),
            secondaryAssetsLastDispatchError: undefined,
            secondaryAssetsUpdatedAt: Date.now(),
        })

        return {
            dispatched: true,
            dispatchAttempts: nextAttempts,
        }
    },
})

export const recordSecondaryAssetsDispatchFailure = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        errorMessage: v.string(),
    },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image || image.secondaryAssetsDispatchStatus === "completed" || image.secondaryAssetsDispatchStatus === "cancelled") {
            return
        }

        await ctx.db.patch(args.imageId, {
            secondaryAssetsDispatchStatus: "pending",
            secondaryAssetsLastDispatchError: args.errorMessage,
            secondaryAssetsUpdatedAt: Date.now(),
        })
    },
})

export const claimSecondaryAssetsForWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        workerAttempt: v.number(),
    },
    returns: v.object({
        claimed: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image || !image.contentType.startsWith("video/")) {
            return { claimed: false }
        }

        if (image.secondaryAssetsDispatchStatus === "completed" || image.secondaryAssetsDispatchStatus === "cancelled") {
            return { claimed: false }
        }

        const currentAttempt = image.secondaryAssetsWorkerAttempt ?? 0
        const canClaimPending =
            image.secondaryAssetsDispatchStatus === undefined ||
            image.secondaryAssetsDispatchStatus === "pending" ||
            image.secondaryAssetsDispatchStatus === "dispatched" ||
            image.secondaryAssetsDispatchStatus === "failed"

        const canReclaimProcessing =
            image.secondaryAssetsDispatchStatus === "processing" &&
            args.workerAttempt > currentAttempt

        if (!canClaimPending && !canReclaimProcessing) {
            return { claimed: false }
        }

        await ctx.db.patch(args.imageId, {
            secondaryAssetsDispatchStatus: "processing",
            secondaryAssetsClaimToken: args.claimToken,
            secondaryAssetsWorkerAttempt: args.workerAttempt,
            secondaryAssetsUpdatedAt: Date.now(),
        })

        return { claimed: true }
    },
})

export const getSecondaryAssetsWorkerContinuationState = internalQuery({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
    },
    returns: v.object({
        canContinue: v.boolean(),
        videoUrl: v.optional(v.string()),
        r2Key: v.optional(v.string()),
        contentType: v.optional(v.string()),
        dispatchStatus: v.optional(secondaryAssetsDispatchStatusValidator),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { canContinue: false }
        }

        if (
            image.secondaryAssetsDispatchStatus !== "processing" ||
            image.secondaryAssetsClaimToken !== args.claimToken ||
            !image.contentType.startsWith("video/")
        ) {
            return { canContinue: false }
        }

        return {
            canContinue: true,
            videoUrl: image.url,
            r2Key: image.r2Key,
            contentType: image.contentType,
            dispatchStatus: image.secondaryAssetsDispatchStatus,
        }
    },
})

export const completeSecondaryAssetsFromWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        thumbnailR2Key: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        previewR2Key: v.optional(v.string()),
        previewUrl: v.optional(v.string()),
    },
    returns: v.object({
        completed: v.boolean(),
        duplicate: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { completed: false, duplicate: false }
        }

        if (image.secondaryAssetsDispatchStatus === "completed") {
            return { completed: false, duplicate: true }
        }

        if (image.secondaryAssetsDispatchStatus === "cancelled") {
            return { completed: false, duplicate: false }
        }

        if (image.secondaryAssetsClaimToken !== args.claimToken) {
            return { completed: false, duplicate: false }
        }

        const updates: Record<string, string | number | undefined> = {
            secondaryAssetsDispatchStatus: "completed",
            secondaryAssetsLastDispatchError: undefined,
            secondaryAssetsClaimToken: undefined,
            secondaryAssetsUpdatedAt: Date.now(),
        }

        if (args.thumbnailR2Key !== undefined) {
            updates.thumbnailR2Key = args.thumbnailR2Key
        }
        if (args.thumbnailUrl !== undefined) {
            updates.thumbnailUrl = args.thumbnailUrl
        }
        if (args.previewR2Key !== undefined) {
            updates.previewR2Key = args.previewR2Key
        }
        if (args.previewUrl !== undefined) {
            updates.previewUrl = args.previewUrl
        }

        await ctx.db.patch(args.imageId, updates)

        return { completed: true, duplicate: false }
    },
})

export const failSecondaryAssetsFromWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        errorMessage: v.string(),
    },
    returns: v.object({
        failed: v.boolean(),
        duplicate: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { failed: false, duplicate: false }
        }

        if (image.secondaryAssetsDispatchStatus === "failed") {
            return { failed: false, duplicate: true }
        }

        if (image.secondaryAssetsDispatchStatus === "completed" || image.secondaryAssetsDispatchStatus === "cancelled") {
            return { failed: false, duplicate: false }
        }

        if (image.secondaryAssetsClaimToken !== args.claimToken) {
            return { failed: false, duplicate: false }
        }

        await ctx.db.patch(args.imageId, {
            secondaryAssetsDispatchStatus: "failed",
            secondaryAssetsLastDispatchError: args.errorMessage,
            secondaryAssetsClaimToken: undefined,
            secondaryAssetsUpdatedAt: Date.now(),
        })

        return { failed: true, duplicate: false }
    },
})
