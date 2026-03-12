import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { z } from "zod"
import {
    createWorkerHttpAction,
    generationResultSchema,
    nonEmptyStringSchema,
    nonNegativeIntSchema,
    positiveIntSchema,
    secondaryAssetsResultSchema,
} from "./lib/cloudflareWorkerHttp"

const claimTokenSchema = nonEmptyStringSchema
const workerAttemptSchema = positiveIntSchema
const providerRequestIdSchema = nonEmptyStringSchema.optional()
const retryCountSchema = nonNegativeIntSchema.optional()

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0
}

const generationIdSchema = z.custom<Id<"pendingGenerations">>(isNonEmptyString, {
    message: "Invalid generationId",
})
const batchJobIdSchema = z.custom<Id<"batchJobs">>(isNonEmptyString, {
    message: "Invalid batchJobId",
})
const imageIdSchema = z.custom<Id<"generatedImages">>(isNonEmptyString, {
    message: "Invalid imageId",
})
const itemIndexSchema = nonNegativeIntSchema
const moderationStageSchema = z.enum(["prompt_inference", "vision_analysis"])

const claimBodySchema = z.object({
    generationId: generationIdSchema,
    claimToken: claimTokenSchema,
    workerAttempt: workerAttemptSchema,
    providerRequestId: providerRequestIdSchema,
})

const continueBodySchema = z.object({
    generationId: generationIdSchema,
    claimToken: claimTokenSchema,
})

const completeBodySchema = z.object({
    generationId: generationIdSchema,
    claimToken: claimTokenSchema,
    ...generationResultSchema.shape,
    retryCount: retryCountSchema,
    providerRequestId: providerRequestIdSchema,
})

const failBodySchema = z.object({
    generationId: generationIdSchema,
    claimToken: claimTokenSchema,
    errorMessage: nonEmptyStringSchema,
    errorCode: z.number().int().optional(),
    retryCount: retryCountSchema,
    providerRequestId: providerRequestIdSchema,
})

const batchClaimBodySchema = z.object({
    batchJobId: batchJobIdSchema,
    itemIndex: itemIndexSchema,
    claimToken: claimTokenSchema,
    workerAttempt: workerAttemptSchema,
    providerRequestId: providerRequestIdSchema,
})

const batchContinueBodySchema = z.object({
    batchJobId: batchJobIdSchema,
    itemIndex: itemIndexSchema,
    claimToken: claimTokenSchema,
})

const batchCompleteBodySchema = z.object({
    batchJobId: batchJobIdSchema,
    itemIndex: itemIndexSchema,
    claimToken: claimTokenSchema,
    ...generationResultSchema.shape,
    retryCount: retryCountSchema,
    providerRequestId: providerRequestIdSchema,
})

const batchFailBodySchema = z.object({
    batchJobId: batchJobIdSchema,
    itemIndex: itemIndexSchema,
    claimToken: claimTokenSchema,
    errorMessage: nonEmptyStringSchema,
    errorCode: z.number().int().optional(),
    retryCount: retryCountSchema,
    providerRequestId: providerRequestIdSchema,
})

const secondaryAssetsUpdateBodySchema = z.object({
    imageId: imageIdSchema,
    ...secondaryAssetsResultSchema.shape,
})

const secondaryAssetsClaimBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    workerAttempt: workerAttemptSchema,
})

const secondaryAssetsContinueBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
})

const secondaryAssetsCompleteBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    ...secondaryAssetsResultSchema.shape,
})

const secondaryAssetsFailBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    errorMessage: nonEmptyStringSchema,
})

const moderationClaimBodySchema = z.object({
    imageId: imageIdSchema,
    stage: moderationStageSchema,
    claimToken: claimTokenSchema,
    workerAttempt: workerAttemptSchema,
    providerRequestId: providerRequestIdSchema,
})

const moderationContinueBodySchema = z.object({
    imageId: imageIdSchema,
    stage: moderationStageSchema,
    claimToken: claimTokenSchema,
})

const promptInferenceCompleteBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    promptInference: z.object({
        category: nonEmptyStringSchema,
        confidence: z.number().min(0).max(1),
        reasoning: nonEmptyStringSchema,
        provider: nonEmptyStringSchema,
        analyzedAt: positiveIntSchema,
    }),
    action: z.enum(["tag_sensitive", "tag_safe", "escalate_to_vision"]),
    providerRequestId: providerRequestIdSchema,
})

const promptInferenceFailBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    errorMessage: nonEmptyStringSchema,
    providerRequestId: providerRequestIdSchema,
})

const visionAnalysisCompleteBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    isSensitive: z.boolean(),
    confidence: z.number().min(0).max(1),
    contentAnalysis: z.object({
        nudity: nonEmptyStringSchema.optional(),
        sexual: nonEmptyStringSchema.optional(),
        violence: nonEmptyStringSchema.optional(),
        analyzedAt: positiveIntSchema,
    }),
    providerRequestId: providerRequestIdSchema,
})

const visionAnalysisFailBodySchema = z.object({
    imageId: imageIdSchema,
    claimToken: claimTokenSchema,
    errorMessage: nonEmptyStringSchema,
    rateLimited: z.boolean().optional(),
    providerRequestId: providerRequestIdSchema,
})

const providerRateLimitBodySchema = z.object({
    provider: z.enum(["groq", "openrouter"]),
    errorBody: nonEmptyStringSchema,
})

export const claimSingleGenerationHttp = createWorkerHttpAction(claimBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = claimBodySchema.parse(body)
    return ctx.runMutation(internal.singleGeneration.claimGenerationForWorker, {
        generationId: parsedBody.generationId,
        claimToken: parsedBody.claimToken,
        workerAttempt: parsedBody.workerAttempt,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const continueSingleGenerationHttp = createWorkerHttpAction(continueBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = continueBodySchema.parse(body)
    return ctx.runQuery(internal.singleGeneration.getGenerationWorkerContinuationState, {
        generationId: parsedBody.generationId,
        claimToken: parsedBody.claimToken,
    })
})

export const completeSingleGenerationHttp = createWorkerHttpAction(completeBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = completeBodySchema.parse(body)
    return ctx.runMutation(internal.singleGeneration.completeGenerationFromWorkerResult, {
        generationId: parsedBody.generationId,
        claimToken: parsedBody.claimToken,
        r2Key: parsedBody.r2Key,
        url: parsedBody.url,
        width: parsedBody.width,
        height: parsedBody.height,
        seed: parsedBody.seed,
        contentType: parsedBody.contentType,
        sizeBytes: parsedBody.sizeBytes,
        retryCount: parsedBody.retryCount,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const failSingleGenerationHttp = createWorkerHttpAction(failBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = failBodySchema.parse(body)
    return ctx.runMutation(internal.singleGeneration.failGenerationFromWorker, {
        generationId: parsedBody.generationId,
        claimToken: parsedBody.claimToken,
        errorMessage: parsedBody.errorMessage,
        errorCode: parsedBody.errorCode,
        retryCount: parsedBody.retryCount,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const claimBatchItemHttp = createWorkerHttpAction(batchClaimBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = batchClaimBodySchema.parse(body)
    return ctx.runMutation(internal.batchGeneration.claimBatchItemForWorker, {
        batchJobId: parsedBody.batchJobId,
        itemIndex: parsedBody.itemIndex,
        claimToken: parsedBody.claimToken,
        workerAttempt: parsedBody.workerAttempt,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const continueBatchItemHttp = createWorkerHttpAction(batchContinueBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = batchContinueBodySchema.parse(body)
    return ctx.runQuery(internal.batchGeneration.getBatchItemWorkerContinuationState, {
        batchJobId: parsedBody.batchJobId,
        itemIndex: parsedBody.itemIndex,
        claimToken: parsedBody.claimToken,
    })
})

export const completeBatchItemHttp = createWorkerHttpAction(batchCompleteBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = batchCompleteBodySchema.parse(body)
    return ctx.runMutation(internal.batchGeneration.completeBatchItemFromWorkerResult, {
        batchJobId: parsedBody.batchJobId,
        itemIndex: parsedBody.itemIndex,
        claimToken: parsedBody.claimToken,
        r2Key: parsedBody.r2Key,
        url: parsedBody.url,
        width: parsedBody.width,
        height: parsedBody.height,
        seed: parsedBody.seed,
        contentType: parsedBody.contentType,
        sizeBytes: parsedBody.sizeBytes,
        retryCount: parsedBody.retryCount,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const failBatchItemHttp = createWorkerHttpAction(batchFailBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = batchFailBodySchema.parse(body)
    return ctx.runMutation(internal.batchGeneration.failBatchItemFromWorker, {
        batchJobId: parsedBody.batchJobId,
        itemIndex: parsedBody.itemIndex,
        claimToken: parsedBody.claimToken,
        errorMessage: parsedBody.errorMessage,
        errorCode: parsedBody.errorCode,
        retryCount: parsedBody.retryCount,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const updateSecondaryAssetsHttp = createWorkerHttpAction(secondaryAssetsUpdateBodySchema, async (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = secondaryAssetsUpdateBodySchema.parse(body)
    await ctx.runMutation(internal.secondaryAssets.updateSecondaryAssets, {
        imageId: parsedBody.imageId,
        thumbnailR2Key: parsedBody.thumbnailR2Key,
        thumbnailUrl: parsedBody.thumbnailUrl,
        previewR2Key: parsedBody.previewR2Key,
        previewUrl: parsedBody.previewUrl,
    })

    return { ok: true }
})

export const claimSecondaryAssetsHttp = createWorkerHttpAction(secondaryAssetsClaimBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = secondaryAssetsClaimBodySchema.parse(body)
    return ctx.runMutation(internal.secondaryAssets.claimSecondaryAssetsForWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        workerAttempt: parsedBody.workerAttempt,
    })
})

export const continueSecondaryAssetsHttp = createWorkerHttpAction(secondaryAssetsContinueBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = secondaryAssetsContinueBodySchema.parse(body)
    return ctx.runQuery(internal.secondaryAssets.getSecondaryAssetsWorkerContinuationState, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
    })
})

export const completeSecondaryAssetsHttp = createWorkerHttpAction(secondaryAssetsCompleteBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = secondaryAssetsCompleteBodySchema.parse(body)
    return ctx.runMutation(internal.secondaryAssets.completeSecondaryAssetsFromWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        thumbnailR2Key: parsedBody.thumbnailR2Key,
        thumbnailUrl: parsedBody.thumbnailUrl,
        previewR2Key: parsedBody.previewR2Key,
        previewUrl: parsedBody.previewUrl,
    })
})

export const failSecondaryAssetsHttp = createWorkerHttpAction(secondaryAssetsFailBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = secondaryAssetsFailBodySchema.parse(body)
    return ctx.runMutation(internal.secondaryAssets.failSecondaryAssetsFromWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        errorMessage: parsedBody.errorMessage,
    })
})

export const claimModerationHttp = createWorkerHttpAction(moderationClaimBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = moderationClaimBodySchema.parse(body)
    return ctx.runMutation(internal.contentAnalysis.claimModerationForWorker, {
        imageId: parsedBody.imageId,
        stage: parsedBody.stage,
        claimToken: parsedBody.claimToken,
        workerAttempt: parsedBody.workerAttempt,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const continueModerationHttp = createWorkerHttpAction(moderationContinueBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = moderationContinueBodySchema.parse(body)
    return ctx.runQuery(internal.contentAnalysis.getModerationWorkerContinuationState, {
        imageId: parsedBody.imageId,
        stage: parsedBody.stage,
        claimToken: parsedBody.claimToken,
    })
})

export const completePromptInferenceHttp = createWorkerHttpAction(promptInferenceCompleteBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = promptInferenceCompleteBodySchema.parse(body)
    return ctx.runMutation(internal.contentAnalysis.completePromptInferenceFromWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        promptInference: parsedBody.promptInference,
        action: parsedBody.action,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const failPromptInferenceHttp = createWorkerHttpAction(promptInferenceFailBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = promptInferenceFailBodySchema.parse(body)
    return ctx.runMutation(internal.contentAnalysis.failPromptInferenceFromWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        errorMessage: parsedBody.errorMessage,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const completeVisionAnalysisHttp = createWorkerHttpAction(visionAnalysisCompleteBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = visionAnalysisCompleteBodySchema.parse(body)
    return ctx.runMutation(internal.contentAnalysis.completeVisionAnalysisFromWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        isSensitive: parsedBody.isSensitive,
        confidence: parsedBody.confidence,
        contentAnalysis: parsedBody.contentAnalysis,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const failVisionAnalysisHttp = createWorkerHttpAction(visionAnalysisFailBodySchema, (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = visionAnalysisFailBodySchema.parse(body)
    return ctx.runMutation(internal.contentAnalysis.failVisionAnalysisFromWorker, {
        imageId: parsedBody.imageId,
        claimToken: parsedBody.claimToken,
        errorMessage: parsedBody.errorMessage,
        rateLimited: parsedBody.rateLimited,
        providerRequestId: parsedBody.providerRequestId,
    })
})

export const recordProviderRateLimitHttp = createWorkerHttpAction(providerRateLimitBodySchema, async (ctx, body: unknown): Promise<unknown> => {
    const parsedBody = providerRateLimitBodySchema.parse(body)
    await ctx.runMutation(internal.lib.providerHealthFunctions.recordRateLimit, {
        provider: parsedBody.provider,
        errorBody: parsedBody.errorBody,
    })

    return { ok: true }
})
