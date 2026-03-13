import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
    type ActionCtx,
    type MutationCtx,
    internalAction,
    internalMutation,
    internalQuery,
} from "./_generated/server"

/** Delay between recovery re-dispatches in ms (targets ~28 RPM for Groq). */
const DELAY_BETWEEN_REQUESTS_MS = 2100

/** Fetch a small lookahead so we know whether to schedule the next recovery action. */
const ANALYSIS_QUEUE_LOOKAHEAD = 2
/** Allow a small clock skew so an about-to-run scheduled job can still claim execution. */
const ANALYSIS_SCHEDULE_CLAIM_SKEW_MS = 1000
const ANALYSIS_RECOVERY_JOB_NAME = "content_analysis_recovery"

const moderationStageValidator = v.union(
    v.literal("prompt_inference"),
    v.literal("vision_analysis")
)
type DispatchStatus = "pending" | "dispatched" | "processing" | "completed" | "failed" | "cancelled"

type PromptInferencePayload = {
    category: string
    confidence: number
    reasoning: string
    provider: string
    analyzedAt: number
}

type VisionAnalysisPayload = {
    nudity?: string
    sexual?: string
    violence?: string
    analyzedAt: number
}

type ProviderHealthSnapshot = {
    isAvailable: boolean
    rateLimitedUntil?: number
}

type BackgroundJobStateLike = {
    updatedAt: number
    _creationTime: number
    nextRunAt?: number
    scheduledToken?: string
    lastRunAt?: number
}

type BackgroundJobStateDoc = Doc<"backgroundJobState">

function isSensitivityResolved(image: Doc<"generatedImages"> | null): boolean {
    return image?.isSensitive !== undefined && image?.isSensitive !== null
}

function compareBackgroundJobStateRecency<T extends BackgroundJobStateLike>(left: T, right: T): number {
    if (left.updatedAt !== right.updatedAt) {
        return right.updatedAt - left.updatedAt
    }

    return right._creationTime - left._creationTime
}

export function getLatestBackgroundJobLastRunAt<T extends { lastRunAt?: number }>(
    rows: T[]
): number | undefined {
    const lastRunAtValues = rows
        .map((row) => row.lastRunAt)
        .filter((lastRunAt): lastRunAt is number => lastRunAt !== undefined)

    if (lastRunAtValues.length === 0) {
        return undefined
    }

    return Math.max(...lastRunAtValues)
}

export function getEffectiveScheduledBackgroundJob<T extends BackgroundJobStateLike>(
    rows: T[]
): (T & { nextRunAt: number; scheduledToken: string }) | null {
    const scheduledRows = rows.filter(
        (row): row is T & { nextRunAt: number; scheduledToken: string } =>
            row.nextRunAt !== undefined && row.scheduledToken !== undefined
    )

    if (scheduledRows.length === 0) {
        return null
    }

    return scheduledRows.sort((left, right) => {
        if (left.nextRunAt !== right.nextRunAt) {
            return left.nextRunAt - right.nextRunAt
        }

        return compareBackgroundJobStateRecency(left, right)
    })[0]
}

async function listBackgroundJobStateRows(
    ctx: MutationCtx,
    jobName: string
): Promise<BackgroundJobStateDoc[]> {
    return await ctx.db
        .query("backgroundJobState")
        .withIndex("by_job_name_updated_at", (q) => q.eq("jobName", jobName))
        .collect()
}

async function reconcileBackgroundJobStateRows(
    ctx: MutationCtx,
    args: {
        jobName: string
        rows: BackgroundJobStateDoc[]
        nextRunAt?: number
        scheduledToken?: string
        lastRunAt?: number
        now: number
    }
) {
    const canonicalRow = [...args.rows].sort(compareBackgroundJobStateRecency)[0]

    if (!canonicalRow) {
        await ctx.db.insert("backgroundJobState", {
            jobName: args.jobName,
            nextRunAt: args.nextRunAt,
            scheduledToken: args.scheduledToken,
            lastRunAt: args.lastRunAt,
            updatedAt: args.now,
        })
        return
    }

    const duplicateRows = args.rows.filter((row) => row._id !== canonicalRow._id)
    const stateChanged =
        canonicalRow.nextRunAt !== args.nextRunAt ||
        canonicalRow.scheduledToken !== args.scheduledToken ||
        canonicalRow.lastRunAt !== args.lastRunAt

    if (stateChanged || duplicateRows.length > 0) {
        await ctx.db.patch(canonicalRow._id, {
            nextRunAt: args.nextRunAt,
            scheduledToken: args.scheduledToken,
            lastRunAt: args.lastRunAt,
            updatedAt: args.now,
        })
    }

    for (const duplicateRow of duplicateRows) {
        await ctx.db.delete(duplicateRow._id)
    }
}

async function upsertPromptInference(
    ctx: MutationCtx,
    imageId: Id<"generatedImages">,
    promptInference: PromptInferencePayload,
    isSensitive?: boolean,
    confidence?: number
) {
    const updates: Partial<Doc<"generatedImages">> = {}
    if (isSensitive !== undefined) {
        updates.isSensitive = isSensitive
        updates.sensitiveSource = "prompt_inference"
    }
    if (confidence !== undefined) {
        updates.sensitiveConfidence = confidence
    }
    if (Object.keys(updates).length > 0) {
        await ctx.db.patch(imageId, updates)
    }

    const details = await ctx.db
        .query("generatedImageDetails")
        .withIndex("by_image", (q) => q.eq("imageId", imageId))
        .unique()

    if (details) {
        await ctx.db.patch(details._id, {
            promptInference,
        })
        return
    }

    await ctx.db.insert("generatedImageDetails", {
        imageId,
        generationParams: {},
        promptInference,
    })
}

async function upsertVisionAnalysis(
    ctx: MutationCtx,
    imageId: Id<"generatedImages">,
    isSensitive: boolean,
    confidence: number,
    contentAnalysis: VisionAnalysisPayload
) {
    await ctx.db.patch(imageId, {
        isSensitive,
        sensitiveSource: "vision_analysis",
        sensitiveConfidence: confidence,
    })

    const details = await ctx.db
        .query("generatedImageDetails")
        .withIndex("by_image", (q) => q.eq("imageId", imageId))
        .unique()

    if (details) {
        await ctx.db.patch(details._id, {
            contentAnalysis,
        })
        return
    }

    await ctx.db.insert("generatedImageDetails", {
        imageId,
        generationParams: {},
        contentAnalysis,
    })
}

export function getNextAnalysisRunDelayMs(args: {
    queuedImageCount: number
    providerRecoveryDelayMs: number | null
}): number | null {
    if (args.providerRecoveryDelayMs !== null) {
        return args.providerRecoveryDelayMs
    }

    return args.queuedImageCount === ANALYSIS_QUEUE_LOOKAHEAD
        ? DELAY_BETWEEN_REQUESTS_MS
        : null
}

export function shouldSkipAnalyzeRecentImagesSchedule(args: {
    existingNextRunAt: number | undefined
    requestedNextRunAt: number
    now: number
}): boolean {
    if (args.existingNextRunAt === undefined) {
        return false
    }

    const existingRunIsStillClaimable =
        args.existingNextRunAt >= args.now - ANALYSIS_SCHEDULE_CLAIM_SKEW_MS

    return existingRunIsStillClaimable && args.existingNextRunAt <= args.requestedNextRunAt
}

export function getProviderRecoveryDelayMs(args: {
    providerHealths: Array<ProviderHealthSnapshot | null>
    now: number
}): number | null {
    const unavailableProviderHealths = args.providerHealths
        .filter((health): health is ProviderHealthSnapshot => health !== null)
        .filter((health) => !health.isAvailable)

    if (unavailableProviderHealths.length === 0) {
        return null
    }

    const unavailableResets = unavailableProviderHealths
        .map((health) => health.rateLimitedUntil)
        .filter((resetAt): resetAt is number => typeof resetAt === "number" && resetAt > args.now)

    if (unavailableResets.length === 0) {
        return DELAY_BETWEEN_REQUESTS_MS
    }

    return Math.max(DELAY_BETWEEN_REQUESTS_MS, Math.min(...unavailableResets) - args.now)
}

export function shouldRunRecoveryPromptInference(args: {
    hasPrompt: boolean
    hasPromptInference: boolean
}): boolean {
    return args.hasPrompt && !args.hasPromptInference
}

export function getVisionFailureDispatchStatus(args: {
    rateLimited: boolean
}): DispatchStatus {
    return args.rateLimited ? "pending" : "failed"
}

/**
 * Lightweight moderation coordinator state for worker dispatch.
 */
export const getModerationJobInternal = internalQuery({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return null
        }

        const details = await ctx.db
            .query("generatedImageDetails")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .unique()

        return {
            image,
            hasPromptInference: details?.promptInference !== undefined,
        }
    },
})

/**
 * Mark a moderation task as dispatched to the Cloudflare worker plane.
 */
export const markModerationDispatched = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        stage: moderationStageValidator,
    },
    returns: v.object({
        dispatched: v.boolean(),
        dispatchAttempts: v.number(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image || isSensitivityResolved(image)) {
            return { dispatched: false, dispatchAttempts: 0 }
        }

        if (args.stage === "prompt_inference" && (!image.prompt || image.prompt.trim().length === 0)) {
            return { dispatched: false, dispatchAttempts: image.moderationDispatchAttempts ?? 0 }
        }

        if (args.stage === "vision_analysis" && !image.url) {
            return { dispatched: false, dispatchAttempts: image.moderationDispatchAttempts ?? 0 }
        }

        if (
            image.moderationStage === args.stage &&
            (image.moderationDispatchStatus === "dispatched" || image.moderationDispatchStatus === "processing")
        ) {
            return { dispatched: false, dispatchAttempts: image.moderationDispatchAttempts ?? 0 }
        }

        const now = Date.now()
        const nextAttempts = image.moderationStage === args.stage
            ? (image.moderationDispatchAttempts ?? 0) + 1
            : 1

        await ctx.db.patch(args.imageId, {
            moderationStage: args.stage,
            moderationDispatchStatus: "dispatched" satisfies DispatchStatus,
            moderationDispatchAttempts: nextAttempts,
            moderationDispatchedAt: now,
            moderationLastDispatchError: undefined,
            moderationUpdatedAt: now,
        })

        return {
            dispatched: true,
            dispatchAttempts: nextAttempts,
        }
    },
})

/**
 * Record a failed Convex -> Cloudflare dispatch attempt.
 */
export const recordModerationDispatchFailure = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        stage: moderationStageValidator,
        errorMessage: v.string(),
    },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image || isSensitivityResolved(image)) {
            return
        }

        const now = Date.now()
        await ctx.db.patch(args.imageId, {
            moderationStage: args.stage,
            moderationDispatchStatus: "pending",
            moderationLastDispatchError: args.errorMessage,
            moderationUpdatedAt: now,
        })
    },
})

/**
 * Claim a moderation task for Cloudflare worker execution.
 */
export const claimModerationForWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        stage: moderationStageValidator,
        claimToken: v.string(),
        workerAttempt: v.number(),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        claimed: v.boolean(),
        prompt: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image || isSensitivityResolved(image)) {
            return { claimed: false }
        }

        if (args.stage === "prompt_inference" && (!image.prompt || image.prompt.trim().length === 0)) {
            return { claimed: false }
        }

        if (args.stage === "vision_analysis" && !image.url) {
            return { claimed: false }
        }

        const currentAttempt = image.moderationWorkerAttempt ?? 0
        const canClaimDispatched =
            image.moderationStage === args.stage &&
            (image.moderationDispatchStatus === undefined ||
                image.moderationDispatchStatus === "pending" ||
                image.moderationDispatchStatus === "dispatched")

        const canReclaimProcessing =
            image.moderationStage === args.stage &&
            image.moderationDispatchStatus === "processing" &&
            args.workerAttempt > currentAttempt

        if (!canClaimDispatched && !canReclaimProcessing) {
            return { claimed: false }
        }

        await ctx.db.patch(args.imageId, {
            moderationStage: args.stage,
            moderationDispatchStatus: "processing",
            moderationClaimToken: args.claimToken,
            moderationWorkerAttempt: args.workerAttempt,
            moderationProviderRequestId: args.providerRequestId,
            moderationUpdatedAt: Date.now(),
        })

        if (args.stage === "prompt_inference") {
            return {
                claimed: true,
                prompt: image.prompt,
            }
        }

        return {
            claimed: true,
            imageUrl: image.url,
        }
    },
})

export const scheduleAnalyzeRecentImagesRun = internalMutation({
    args: {
        delayMs: v.number(),
    },
    returns: v.object({
        scheduled: v.boolean(),
        nextRunAt: v.number(),
    }),
    handler: async (ctx, args) => {
        const now = Date.now()
        const delayMs = Math.max(0, args.delayMs)
        const nextRunAt = now + delayMs
        const existingJobs = await listBackgroundJobStateRows(ctx, ANALYSIS_RECOVERY_JOB_NAME)
        const existingScheduledJob = getEffectiveScheduledBackgroundJob(existingJobs)
        const lastRunAt = getLatestBackgroundJobLastRunAt(existingJobs)

        if (shouldSkipAnalyzeRecentImagesSchedule({
            existingNextRunAt: existingScheduledJob?.nextRunAt,
            requestedNextRunAt: nextRunAt,
            now,
        })) {
            await reconcileBackgroundJobStateRows(ctx, {
                jobName: ANALYSIS_RECOVERY_JOB_NAME,
                rows: existingJobs,
                nextRunAt: existingScheduledJob?.nextRunAt,
                scheduledToken: existingScheduledJob?.scheduledToken,
                lastRunAt,
                now,
            })

            return {
                scheduled: false,
                nextRunAt: existingScheduledJob?.nextRunAt ?? nextRunAt,
            }
        }

        const scheduledToken = `${now}-${nextRunAt}`

        await reconcileBackgroundJobStateRows(ctx, {
            jobName: ANALYSIS_RECOVERY_JOB_NAME,
            rows: existingJobs,
            nextRunAt,
            scheduledToken,
            lastRunAt,
            now,
        })

        await ctx.scheduler.runAfter(delayMs, internal.contentAnalysis.analyzeRecentImages, {
            scheduleToken: scheduledToken,
        })

        return {
            scheduled: true,
            nextRunAt,
        }
    },
})

export const claimScheduledAnalyzeRecentImagesRun = internalMutation({
    args: {
        scheduleToken: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const now = Date.now()
        const existingJobs = await listBackgroundJobStateRows(ctx, ANALYSIS_RECOVERY_JOB_NAME)
        const existingScheduledJob = getEffectiveScheduledBackgroundJob(existingJobs)
        const lastRunAt = getLatestBackgroundJobLastRunAt(existingJobs)

        if (!existingScheduledJob || existingScheduledJob.scheduledToken !== args.scheduleToken) {
            if (existingJobs.length > 1) {
                await reconcileBackgroundJobStateRows(ctx, {
                    jobName: ANALYSIS_RECOVERY_JOB_NAME,
                    rows: existingJobs,
                    nextRunAt: existingScheduledJob?.nextRunAt,
                    scheduledToken: existingScheduledJob?.scheduledToken,
                    lastRunAt,
                    now,
                })
            }

            return false
        }

        if (
            existingScheduledJob.nextRunAt !== undefined &&
            existingScheduledJob.nextRunAt > now + ANALYSIS_SCHEDULE_CLAIM_SKEW_MS
        ) {
            return false
        }

        await reconcileBackgroundJobStateRows(ctx, {
            jobName: ANALYSIS_RECOVERY_JOB_NAME,
            rows: existingJobs,
            nextRunAt: undefined,
            scheduledToken: undefined,
            lastRunAt: now,
            now,
        })

        return true
    },
})

export const getModerationWorkerContinuationState = internalQuery({
    args: {
        imageId: v.id("generatedImages"),
        stage: moderationStageValidator,
        claimToken: v.string(),
    },
    returns: v.object({
        canContinue: v.boolean(),
        prompt: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { canContinue: false }
        }

        if (
            image.moderationStage !== args.stage ||
            image.moderationDispatchStatus !== "processing" ||
            image.moderationClaimToken !== args.claimToken ||
            isSensitivityResolved(image)
        ) {
            return { canContinue: false }
        }

        if (args.stage === "prompt_inference") {
            return {
                canContinue: !!image.prompt,
                prompt: image.prompt,
            }
        }

        return {
            canContinue: !!image.url,
            imageUrl: image.url,
        }
    },
})

export const completePromptInferenceFromWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        promptInference: v.object({
            category: v.string(),
            confidence: v.number(),
            reasoning: v.string(),
            provider: v.string(),
            analyzedAt: v.number(),
        }),
        action: v.union(
            v.literal("tag_sensitive"),
            v.literal("tag_safe"),
            v.literal("escalate_to_vision")
        ),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        completed: v.boolean(),
        duplicate: v.boolean(),
        escalated: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { completed: false, duplicate: false, escalated: false }
        }

        if (isSensitivityResolved(image)) {
            return { completed: false, duplicate: true, escalated: false }
        }

        if (
            image.moderationStage !== "prompt_inference" ||
            image.moderationDispatchStatus !== "processing" ||
            image.moderationClaimToken !== args.claimToken
        ) {
            return { completed: false, duplicate: false, escalated: false }
        }

        const now = Date.now()
        const promptInference = {
            ...args.promptInference,
            analyzedAt: args.promptInference.analyzedAt ?? now,
        }

        if (args.action === "escalate_to_vision") {
            await upsertPromptInference(ctx, args.imageId, promptInference, undefined, args.promptInference.confidence)

            await ctx.db.patch(args.imageId, {
                moderationStage: "vision_analysis",
                moderationDispatchStatus: "pending",
                moderationDispatchAttempts: 0,
                moderationDispatchedAt: undefined,
                moderationLastDispatchError: undefined,
                moderationClaimToken: undefined,
                moderationWorkerAttempt: undefined,
                moderationProviderRequestId: args.providerRequestId ?? image.moderationProviderRequestId,
                moderationUpdatedAt: now,
                sensitiveConfidence: args.promptInference.confidence,
            })

            await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchVisionAnalysis, {
                imageId: args.imageId,
            })

            return { completed: true, duplicate: false, escalated: true }
        }

        const isSensitive = args.action === "tag_sensitive"
        await upsertPromptInference(
            ctx,
            args.imageId,
            promptInference,
            isSensitive,
            isSensitive ? args.promptInference.confidence : 0
        )

        await ctx.db.patch(args.imageId, {
            moderationStage: "prompt_inference",
            moderationDispatchStatus: "completed",
            moderationClaimToken: undefined,
            moderationWorkerAttempt: undefined,
            moderationProviderRequestId: args.providerRequestId ?? image.moderationProviderRequestId,
            moderationUpdatedAt: now,
        })

        return { completed: true, duplicate: false, escalated: false }
    },
})

export const failPromptInferenceFromWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        errorMessage: v.string(),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        failed: v.boolean(),
        duplicate: v.boolean(),
        escalated: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { failed: false, duplicate: false, escalated: false }
        }

        if (isSensitivityResolved(image)) {
            return { failed: false, duplicate: true, escalated: false }
        }

        if (
            image.moderationStage !== "prompt_inference" ||
            image.moderationDispatchStatus !== "processing" ||
            image.moderationClaimToken !== args.claimToken
        ) {
            return { failed: false, duplicate: false, escalated: false }
        }

        await ctx.db.patch(args.imageId, {
            moderationStage: "vision_analysis",
            moderationDispatchStatus: "pending",
            moderationDispatchAttempts: 0,
            moderationDispatchedAt: undefined,
            moderationLastDispatchError: args.errorMessage,
            moderationClaimToken: undefined,
            moderationWorkerAttempt: undefined,
            moderationProviderRequestId: args.providerRequestId ?? image.moderationProviderRequestId,
            moderationUpdatedAt: Date.now(),
        })

        await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchVisionAnalysis, {
            imageId: args.imageId,
        })

        return { failed: true, duplicate: false, escalated: true }
    },
})

export const completeVisionAnalysisFromWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        isSensitive: v.boolean(),
        confidence: v.number(),
        contentAnalysis: v.object({
            nudity: v.optional(v.string()),
            sexual: v.optional(v.string()),
            violence: v.optional(v.string()),
            analyzedAt: v.number(),
        }),
        providerRequestId: v.optional(v.string()),
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

        if (isSensitivityResolved(image)) {
            return { completed: false, duplicate: true }
        }

        if (
            image.moderationStage !== "vision_analysis" ||
            image.moderationDispatchStatus !== "processing" ||
            image.moderationClaimToken !== args.claimToken
        ) {
            return { completed: false, duplicate: false }
        }

        await upsertVisionAnalysis(
            ctx,
            args.imageId,
            args.isSensitive,
            args.confidence,
            args.contentAnalysis
        )

        await ctx.db.patch(args.imageId, {
            moderationStage: "vision_analysis",
            moderationDispatchStatus: "completed",
            moderationClaimToken: undefined,
            moderationWorkerAttempt: undefined,
            moderationProviderRequestId: args.providerRequestId ?? image.moderationProviderRequestId,
            moderationUpdatedAt: Date.now(),
        })

        return { completed: true, duplicate: false }
    },
})

export const failVisionAnalysisFromWorker = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        claimToken: v.string(),
        errorMessage: v.string(),
        rateLimited: v.optional(v.boolean()),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        released: v.boolean(),
        duplicate: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return { released: false, duplicate: false }
        }

        if (isSensitivityResolved(image)) {
            return { released: false, duplicate: true }
        }

        if (
            image.moderationStage !== "vision_analysis" ||
            image.moderationDispatchStatus !== "processing" ||
            image.moderationClaimToken !== args.claimToken
        ) {
            return { released: false, duplicate: false }
        }

        const nextDispatchStatus = getVisionFailureDispatchStatus({
            rateLimited: Boolean(args.rateLimited),
        })

        await ctx.db.patch(args.imageId, {
            moderationStage: "vision_analysis",
            moderationDispatchStatus: nextDispatchStatus,
            moderationLastDispatchError: args.errorMessage,
            moderationClaimToken: undefined,
            moderationWorkerAttempt: undefined,
            moderationProviderRequestId: args.providerRequestId ?? image.moderationProviderRequestId,
            moderationUpdatedAt: Date.now(),
        })

        if (nextDispatchStatus === "pending") {
            const providerHealths: Array<ProviderHealthSnapshot | null> = await ctx.runQuery(
                internal.lib.providerHealthFunctions.getAllHealth,
                {}
            )
            const recoveryDelayMs = getProviderRecoveryDelayMs({
                providerHealths,
                now: Date.now(),
            }) ?? DELAY_BETWEEN_REQUESTS_MS

            await ctx.runMutation(internal.contentAnalysis.scheduleAnalyzeRecentImagesRun, {
                delayMs: recoveryDelayMs,
            })
        }

        return { released: true, duplicate: false }
    },
})

/**
 * Standalone entrypoint for analyzing a single image through the worker plane.
 * Primarily retained for manual/debug use and prompt-inference fallbacks.
 */
export const analyzeImage = internalAction({
    args: { imageId: v.id("generatedImages") },
    handler: async (ctx, args) => {
        const image = await ctx.runQuery(internal.generatedImages.getByIdInternal, {
            imageId: args.imageId,
        })

        if (!image?.url || isSensitivityResolved(image)) {
            return
        }

        await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchVisionAnalysis, {
            imageId: args.imageId,
        })
    },
})

/**
 * Recovery action: re-dispatch one unanalyzed image without doing external work in Convex.
 */
export const analyzeRecentImages = internalAction({
    args: {
        scheduleToken: v.optional(v.string()),
    },
    handler: async (ctx: ActionCtx, args) => {
        if (args.scheduleToken) {
            const claimed = await ctx.runMutation(internal.contentAnalysis.claimScheduledAnalyzeRecentImagesRun, {
                scheduleToken: args.scheduleToken,
            })

            if (!claimed) {
                return
            }
        }

        await ctx.runMutation(internal.lib.providerHealthFunctions.refreshExpiredLimits, {})
        await ctx.runMutation(internal.generatedImages.normalizeLegacyModerationStateBatch, {
            limit: 32,
        })

        const images = await ctx.runQuery(
            internal.generatedImages.getRecoverableUnanalyzedImages,
            { limit: ANALYSIS_QUEUE_LOOKAHEAD }
        )

        if (images.length === 0) {
            return
        }

        let providerRecoveryDelayMs: number | null = null
        const image = images[0]
        if (!image) {
            return
        }

        const recoveryState = image.prompt
            ? await ctx.runQuery(internal.generatedImages.getAnalysisRecoveryState, {
                imageId: image._id,
            })
            : { hasPromptInference: false }

        if (shouldRunRecoveryPromptInference({
            hasPrompt: Boolean(image.prompt),
            hasPromptInference: recoveryState.hasPromptInference,
        })) {
            await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchPromptInference, {
                imageId: image._id,
            })
        } else {
            const providerHealths = await ctx.runQuery(
                internal.lib.providerHealthFunctions.getAllHealth, {}
            )
            const providersAvailable = providerHealths.some((health) => !health || health.isAvailable)

            if (!providersAvailable) {
                const now = Date.now()
                const [groq, openrouter] = providerHealths
                providerRecoveryDelayMs = getProviderRecoveryDelayMs({
                    providerHealths,
                    now,
                })
                console.log(
                    `[Vision] Rate-limited (Groq: ${formatResetTime(groq?.rateLimitedUntil, now)}, OpenRouter: ${formatResetTime(openrouter?.rateLimitedUntil, now)})`
                )
            } else {
                await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchVisionAnalysis, {
                    imageId: image._id,
                })
            }
        }

        const nextRunDelayMs = getNextAnalysisRunDelayMs({
            queuedImageCount: images.length,
            providerRecoveryDelayMs,
        })

        if (nextRunDelayMs !== null) {
            await ctx.runMutation(internal.contentAnalysis.scheduleAnalyzeRecentImagesRun, {
                delayMs: nextRunDelayMs,
            })
        }
    },
})

/**
 * Format time until reset for logging.
 */
function formatResetTime(resetAt: number | undefined, now: number): string {
    if (!resetAt || resetAt <= now) return "available"
    const mins = Math.ceil((resetAt - now) / 60000)
    if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60}m`
    return `${mins}m`
}
