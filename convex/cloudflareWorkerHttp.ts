import { z } from "zod"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"

const workerSecretHeader = "x-bloomstudio-worker-secret"

const claimBodySchema = z.object({
    generationId: z.string(),
    claimToken: z.string().min(1),
    workerAttempt: z.number().int().positive(),
    providerRequestId: z.string().min(1).optional(),
})

const continueBodySchema = z.object({
    generationId: z.string(),
    claimToken: z.string().min(1),
})

const completeBodySchema = z.object({
    generationId: z.string(),
    claimToken: z.string().min(1),
    r2Key: z.string().min(1),
    url: z.string().url(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    seed: z.number().int().nonnegative().optional(),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    retryCount: z.number().int().nonnegative().optional(),
    providerRequestId: z.string().min(1).optional(),
})

const failBodySchema = z.object({
    generationId: z.string(),
    claimToken: z.string().min(1),
    errorMessage: z.string().min(1),
    errorCode: z.number().int().optional(),
    retryCount: z.number().int().nonnegative().optional(),
    providerRequestId: z.string().min(1).optional(),
})

const batchClaimBodySchema = z.object({
    batchJobId: z.string(),
    itemIndex: z.number().int().nonnegative(),
    claimToken: z.string().min(1),
    workerAttempt: z.number().int().positive(),
    providerRequestId: z.string().min(1).optional(),
})

const batchContinueBodySchema = z.object({
    batchJobId: z.string(),
    itemIndex: z.number().int().nonnegative(),
    claimToken: z.string().min(1),
})

const batchCompleteBodySchema = z.object({
    batchJobId: z.string(),
    itemIndex: z.number().int().nonnegative(),
    claimToken: z.string().min(1),
    r2Key: z.string().min(1),
    url: z.string().url(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    seed: z.number().int().nonnegative().optional(),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
    retryCount: z.number().int().nonnegative().optional(),
    providerRequestId: z.string().min(1).optional(),
})

const batchFailBodySchema = z.object({
    batchJobId: z.string(),
    itemIndex: z.number().int().nonnegative(),
    claimToken: z.string().min(1),
    errorMessage: z.string().min(1),
    errorCode: z.number().int().optional(),
    retryCount: z.number().int().nonnegative().optional(),
    providerRequestId: z.string().min(1).optional(),
})

const secondaryAssetsUpdateBodySchema = z.object({
    imageId: z.string(),
    thumbnailR2Key: z.string().min(1).optional(),
    thumbnailUrl: z.string().url().optional(),
    previewR2Key: z.string().min(1).optional(),
    previewUrl: z.string().url().optional(),
})

const secondaryAssetsClaimBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    workerAttempt: z.number().int().positive(),
})

const secondaryAssetsContinueBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
})

const secondaryAssetsCompleteBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    thumbnailR2Key: z.string().min(1).optional(),
    thumbnailUrl: z.string().url().optional(),
    previewR2Key: z.string().min(1).optional(),
    previewUrl: z.string().url().optional(),
})

const secondaryAssetsFailBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    errorMessage: z.string().min(1),
})

const moderationClaimBodySchema = z.object({
    imageId: z.string(),
    stage: z.enum(["prompt_inference", "vision_analysis"]),
    claimToken: z.string().min(1),
    workerAttempt: z.number().int().positive(),
    providerRequestId: z.string().min(1).optional(),
})

const moderationContinueBodySchema = z.object({
    imageId: z.string(),
    stage: z.enum(["prompt_inference", "vision_analysis"]),
    claimToken: z.string().min(1),
})

const promptInferenceCompleteBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    promptInference: z.object({
        category: z.string().min(1),
        confidence: z.number().min(0).max(1),
        reasoning: z.string().min(1),
        provider: z.string().min(1),
        analyzedAt: z.number().int().positive(),
    }),
    action: z.enum(["tag_sensitive", "tag_safe", "escalate_to_vision"]),
    providerRequestId: z.string().min(1).optional(),
})

const promptInferenceFailBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    errorMessage: z.string().min(1),
    providerRequestId: z.string().min(1).optional(),
})

const visionAnalysisCompleteBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    isSensitive: z.boolean(),
    confidence: z.number().min(0).max(1),
    contentAnalysis: z.object({
        nudity: z.string().min(1).optional(),
        sexual: z.string().min(1).optional(),
        violence: z.string().min(1).optional(),
        analyzedAt: z.number().int().positive(),
    }),
    providerRequestId: z.string().min(1).optional(),
})

const visionAnalysisFailBodySchema = z.object({
    imageId: z.string(),
    claimToken: z.string().min(1),
    errorMessage: z.string().min(1),
    rateLimited: z.boolean().optional(),
    providerRequestId: z.string().min(1).optional(),
})

const providerRateLimitBodySchema = z.object({
    provider: z.enum(["groq", "openrouter"]),
    errorBody: z.string().min(1),
})

function unauthorized(): Response {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
}

function badRequest(message: string): Response {
    return Response.json({ ok: false, error: message }, { status: 400 })
}

async function validateWorkerSecret(request: Request): Promise<boolean> {
    const provided = request.headers.get(workerSecretHeader)
    const expected = process.env.BLOOMSTUDIO_WORKER_SHARED_SECRET
    return !!provided && !!expected && provided === expected
}

export const claimSingleGenerationHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = claimBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const claimResult = await ctx.runMutation(internal.singleGeneration.claimGenerationForWorker, {
        generationId: parsed.data.generationId as never,
        claimToken: parsed.data.claimToken,
        workerAttempt: parsed.data.workerAttempt,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(claimResult)
})

export const continueSingleGenerationHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = continueBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runQuery(internal.singleGeneration.getGenerationWorkerContinuationState, {
        generationId: parsed.data.generationId as never,
        claimToken: parsed.data.claimToken,
    })

    return Response.json(result)
})

export const completeSingleGenerationHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = completeBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.singleGeneration.completeGenerationFromWorkerResult, {
        generationId: parsed.data.generationId as never,
        claimToken: parsed.data.claimToken,
        r2Key: parsed.data.r2Key,
        url: parsed.data.url,
        width: parsed.data.width,
        height: parsed.data.height,
        seed: parsed.data.seed,
        contentType: parsed.data.contentType,
        sizeBytes: parsed.data.sizeBytes,
        retryCount: parsed.data.retryCount,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const failSingleGenerationHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = failBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.singleGeneration.failGenerationFromWorker, {
        generationId: parsed.data.generationId as never,
        claimToken: parsed.data.claimToken,
        errorMessage: parsed.data.errorMessage,
        errorCode: parsed.data.errorCode,
        retryCount: parsed.data.retryCount,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const claimBatchItemHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = batchClaimBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.batchGeneration.claimBatchItemForWorker, {
        batchJobId: parsed.data.batchJobId as never,
        itemIndex: parsed.data.itemIndex,
        claimToken: parsed.data.claimToken,
        workerAttempt: parsed.data.workerAttempt,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const continueBatchItemHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = batchContinueBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runQuery(internal.batchGeneration.getBatchItemWorkerContinuationState, {
        batchJobId: parsed.data.batchJobId as never,
        itemIndex: parsed.data.itemIndex,
        claimToken: parsed.data.claimToken,
    })

    return Response.json(result)
})

export const completeBatchItemHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = batchCompleteBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.batchGeneration.completeBatchItemFromWorkerResult, {
        batchJobId: parsed.data.batchJobId as never,
        itemIndex: parsed.data.itemIndex,
        claimToken: parsed.data.claimToken,
        r2Key: parsed.data.r2Key,
        url: parsed.data.url,
        width: parsed.data.width,
        height: parsed.data.height,
        seed: parsed.data.seed,
        contentType: parsed.data.contentType,
        sizeBytes: parsed.data.sizeBytes,
        retryCount: parsed.data.retryCount,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const failBatchItemHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = batchFailBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.batchGeneration.failBatchItemFromWorker, {
        batchJobId: parsed.data.batchJobId as never,
        itemIndex: parsed.data.itemIndex,
        claimToken: parsed.data.claimToken,
        errorMessage: parsed.data.errorMessage,
        errorCode: parsed.data.errorCode,
        retryCount: parsed.data.retryCount,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const updateSecondaryAssetsHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = secondaryAssetsUpdateBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    await ctx.runMutation(internal.secondaryAssets.updateSecondaryAssets, {
        imageId: parsed.data.imageId as never,
        thumbnailR2Key: parsed.data.thumbnailR2Key,
        thumbnailUrl: parsed.data.thumbnailUrl,
        previewR2Key: parsed.data.previewR2Key,
        previewUrl: parsed.data.previewUrl,
    })

    return Response.json({ ok: true })
})

export const claimSecondaryAssetsHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = secondaryAssetsClaimBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.secondaryAssets.claimSecondaryAssetsForWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        workerAttempt: parsed.data.workerAttempt,
    })

    return Response.json(result)
})

export const continueSecondaryAssetsHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = secondaryAssetsContinueBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runQuery(internal.secondaryAssets.getSecondaryAssetsWorkerContinuationState, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
    })

    return Response.json(result)
})

export const completeSecondaryAssetsHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = secondaryAssetsCompleteBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.secondaryAssets.completeSecondaryAssetsFromWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        thumbnailR2Key: parsed.data.thumbnailR2Key,
        thumbnailUrl: parsed.data.thumbnailUrl,
        previewR2Key: parsed.data.previewR2Key,
        previewUrl: parsed.data.previewUrl,
    })

    return Response.json(result)
})

export const failSecondaryAssetsHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = secondaryAssetsFailBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.secondaryAssets.failSecondaryAssetsFromWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        errorMessage: parsed.data.errorMessage,
    })

    return Response.json(result)
})

export const claimModerationHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = moderationClaimBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.contentAnalysis.claimModerationForWorker, {
        imageId: parsed.data.imageId as never,
        stage: parsed.data.stage,
        claimToken: parsed.data.claimToken,
        workerAttempt: parsed.data.workerAttempt,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const continueModerationHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = moderationContinueBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runQuery(internal.contentAnalysis.getModerationWorkerContinuationState, {
        imageId: parsed.data.imageId as never,
        stage: parsed.data.stage,
        claimToken: parsed.data.claimToken,
    })

    return Response.json(result)
})

export const completePromptInferenceHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = promptInferenceCompleteBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.contentAnalysis.completePromptInferenceFromWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        promptInference: parsed.data.promptInference,
        action: parsed.data.action,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const failPromptInferenceHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = promptInferenceFailBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.contentAnalysis.failPromptInferenceFromWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        errorMessage: parsed.data.errorMessage,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const completeVisionAnalysisHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = visionAnalysisCompleteBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.contentAnalysis.completeVisionAnalysisFromWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        isSensitive: parsed.data.isSensitive,
        confidence: parsed.data.confidence,
        contentAnalysis: parsed.data.contentAnalysis,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const failVisionAnalysisHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = visionAnalysisFailBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    const result = await ctx.runMutation(internal.contentAnalysis.failVisionAnalysisFromWorker, {
        imageId: parsed.data.imageId as never,
        claimToken: parsed.data.claimToken,
        errorMessage: parsed.data.errorMessage,
        rateLimited: parsed.data.rateLimited,
        providerRequestId: parsed.data.providerRequestId,
    })

    return Response.json(result)
})

export const recordProviderRateLimitHttp = httpAction(async (ctx, request) => {
    if (!(await validateWorkerSecret(request))) {
        return unauthorized()
    }

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }

    const parsed = providerRateLimitBodySchema.safeParse(json)
    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid request body")
    }

    await ctx.runMutation(internal.lib.providerHealthFunctions.recordRateLimit, {
        provider: parsed.data.provider,
        errorBody: parsed.data.errorBody,
    })

    return Response.json({ ok: true })
})
