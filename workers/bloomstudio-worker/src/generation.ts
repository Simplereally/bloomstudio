import {
    buildPollinationsUrl,
    fetchPollinationsWithTimeout,
    POLLINATIONS_FETCH_TIMEOUT_MS,
} from "../../../convex/lib/pollinations"
import {
    calculateWorkerQueueRetryDelaySeconds,
    WORKER_RETRY_MAX_ATTEMPTS,
} from "../../../lib/cloudflare-worker/retry"
import { getRequiredConfig, postConvexJsonWithRetry } from "./core"
import type {
    Env,
    GenerationParams,
    GenerationQueueMessage,
    QueueMessage,
} from "./types"

type ClaimGenerationResponse = {
    claimed: boolean
}

type ContinueGenerationResponse = {
    canContinue: boolean
    ownerId?: string
    generationParams?: GenerationParams
    apiKey?: string
}

type CompleteGenerationResponse = {
    completed: boolean
    duplicate: boolean
}

type FailGenerationResponse = {
    failed: boolean
    duplicate: boolean
}

type ClaimBatchItemResponse = {
    claimed: boolean
}

type ContinueBatchItemResponse = {
    canContinue: boolean
    ownerId?: string
    generationParams?: GenerationParams
    apiKey?: string
}

type CompleteBatchItemResponse = {
    completed: boolean
    duplicate: boolean
}

type FailBatchItemResponse = {
    failed: boolean
    duplicate: boolean
}

type DirtberrySourceDimensions = {
    width: number
    height: number
}

type SingleGenerationMessage = QueueMessage<Extract<GenerationQueueMessage, { jobType: "single_generation" }>>
type BatchItemMessage = QueueMessage<Extract<GenerationQueueMessage, { jobType: "batch_item" }>>

function isVideoRequest(generationParams: GenerationParams): boolean {
    return (
        generationParams.duration !== undefined ||
        generationParams.audio !== undefined ||
        generationParams.aspectRatio !== undefined ||
        generationParams.lastFrameImage !== undefined
    )
}

function isDirtberryModel(model?: string): boolean {
    const normalized = model?.trim().toLowerCase()
    return !!normalized && (normalized === "dirtberry" || normalized.includes("dirtberry"))
}

function getDirtberrySourceDimensions(): DirtberrySourceDimensions {
    return {
        width: 832,
        height: 1216,
    }
}

async function executeProviderGeneration(apiKey: string, generationParams: GenerationParams) {
    const shouldCropDirtberry = isDirtberryModel(generationParams.model)
    const dirtberrySourceDimensions = shouldCropDirtberry ? getDirtberrySourceDimensions() : null
    const int32Max = 2_147_483_647
    const rawSeed = generationParams.seed ?? Math.floor(Math.random() * int32Max)
    const seed = Math.min(rawSeed, int32Max)

    const generationUrl = buildPollinationsUrl({
        prompt: generationParams.prompt,
        negativePrompt: generationParams.negativePrompt,
        model: generationParams.model,
        width: dirtberrySourceDimensions?.width ?? generationParams.width,
        height: dirtberrySourceDimensions?.height ?? generationParams.height,
        seed,
        enhance: generationParams.enhance,
        private: generationParams.private,
        safe: generationParams.safe,
        image: generationParams.image,
        duration: generationParams.duration,
        audio: generationParams.audio,
        aspectRatio: generationParams.aspectRatio,
        lastFrameImage: generationParams.lastFrameImage,
        quality: generationParams.quality ?? "high",
    })

    const generationAttempt = await fetchPollinationsWithTimeout(
        generationUrl,
        apiKey,
        POLLINATIONS_FETCH_TIMEOUT_MS,
        "[BloomStudioWorker]"
    )

    return {
        generationAttempt,
        seed,
        dirtberrySourceDimensions,
    }
}

async function sha256Hex(input: string): Promise<string> {
    const encoded = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest("SHA-256", encoded)
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("")
}

function getExtension(contentType: string): string {
    const fromContentType = contentType.split("/")[1]?.split(";")[0]?.trim()
    if (!fromContentType) {
        return "bin"
    }

    return fromContentType === "jpeg" ? "jpg" : fromContentType
}

async function generateR2Key(ownerId: string, contentType: string): Promise<string> {
    const userHash = await sha256Hex(ownerId)
    const timestamp = Date.now()
    const randomId = crypto.randomUUID()
    return `generated/${userHash}/${timestamp}-${randomId}.${getExtension(contentType)}`
}

async function uploadToR2(env: Env, objectKey: string, bytes: Uint8Array, contentType: string) {
    const { r2PublicUrl } = getRequiredConfig(env)

    await env.MEDIA_BUCKET.put(objectKey, bytes, {
        httpMetadata: {
            contentType,
            cacheControl: "public, max-age=31536000, immutable",
        },
    })

    return {
        r2Key: objectKey,
        url: `${r2PublicUrl}/${objectKey}`,
        sizeBytes: bytes.byteLength,
    }
}

async function deleteR2Object(env: Env, objectKey: string): Promise<void> {
    try {
        await env.MEDIA_BUCKET.delete(objectKey)
    } catch (error) {
        console.error(`[BloomStudioWorker:${env.APP_ENV}] Failed to delete orphaned R2 object ${objectKey}`, error)
    }
}

function retryMessage(message: QueueMessage<GenerationQueueMessage>, attempt: number): void {
    message.retry({
        delaySeconds: calculateWorkerQueueRetryDelaySeconds(attempt),
    })
}

function getCompletedDimensions(
    params: GenerationParams,
    dirtberrySourceDimensions: DirtberrySourceDimensions | null
) {
    return {
        width: params.width ?? (isVideoRequest(params) ? 1024 : dirtberrySourceDimensions?.width ?? 1024),
        height: params.height ?? (isVideoRequest(params) ? 1024 : dirtberrySourceDimensions?.height ?? 1024),
    }
}

export async function handleSingleGenerationMessage(message: SingleGenerationMessage, env: Env): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)

    const claimResult = await postConvexJsonWithRetry<ClaimGenerationResponse>(env, "/workers/single-generation/claim", {
        generationId: message.body.generationId,
        claimToken,
        workerAttempt,
    })

    if (!claimResult.claimed) {
        message.ack()
        return
    }

    const continuation = await postConvexJsonWithRetry<ContinueGenerationResponse>(env, "/workers/single-generation/continue", {
        generationId: message.body.generationId,
        claimToken,
    })

    if (!continuation.canContinue || !continuation.ownerId || !continuation.generationParams || !continuation.apiKey) {
        message.ack()
        return
    }

    const params = continuation.generationParams
    const { generationAttempt, seed, dirtberrySourceDimensions } = await executeProviderGeneration(continuation.apiKey, params)

    if (!generationAttempt.success) {
        const canRetry = generationAttempt.retryable && workerAttempt < WORKER_RETRY_MAX_ATTEMPTS
        if (canRetry) {
            retryMessage(message, workerAttempt)
            return
        }

        await postConvexJsonWithRetry<FailGenerationResponse>(env, "/workers/single-generation/fail", {
            generationId: message.body.generationId,
            claimToken,
            errorMessage: generationAttempt.errorMessage,
            errorCode: generationAttempt.statusCode,
            retryCount: workerAttempt > 1 ? workerAttempt - 1 : undefined,
        })

        message.ack()
        return
    }

    const response = generationAttempt.response
    const mediaBytes = new Uint8Array(await response.arrayBuffer())
    const contentType = response.headers.get("content-type") || "image/jpeg"

    const postFetchContinuation = await postConvexJsonWithRetry<ContinueGenerationResponse>(env, "/workers/single-generation/continue", {
        generationId: message.body.generationId,
        claimToken,
    })

    if (!postFetchContinuation.canContinue || !postFetchContinuation.ownerId || !postFetchContinuation.generationParams || !postFetchContinuation.apiKey) {
        message.ack()
        return
    }

    const r2Key = await generateR2Key(postFetchContinuation.ownerId, contentType)
    const uploadResult = await uploadToR2(env, r2Key, mediaBytes, contentType)
    const dimensions = getCompletedDimensions(params, dirtberrySourceDimensions)

    let completeResult: CompleteGenerationResponse | undefined
    try {
        completeResult = await postConvexJsonWithRetry<CompleteGenerationResponse>(env, "/workers/single-generation/complete", {
            generationId: message.body.generationId,
            claimToken,
            r2Key: uploadResult.r2Key,
            url: uploadResult.url,
            width: dimensions.width,
            height: dimensions.height,
            seed,
            contentType,
            sizeBytes: uploadResult.sizeBytes,
            retryCount: workerAttempt > 1 ? workerAttempt - 1 : undefined,
        })
    } finally {
        if (completeResult?.completed !== true) {
            await deleteR2Object(env, uploadResult.r2Key)
        }
    }

    message.ack()
}

export async function handleBatchItemMessage(message: BatchItemMessage, env: Env): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)

    const claimResult = await postConvexJsonWithRetry<ClaimBatchItemResponse>(env, "/workers/batch-item/claim", {
        batchJobId: message.body.batchJobId,
        itemIndex: message.body.itemIndex,
        claimToken,
        workerAttempt,
    })

    if (!claimResult.claimed) {
        message.ack()
        return
    }

    const continuation = await postConvexJsonWithRetry<ContinueBatchItemResponse>(env, "/workers/batch-item/continue", {
        batchJobId: message.body.batchJobId,
        itemIndex: message.body.itemIndex,
        claimToken,
    })

    if (!continuation.canContinue || !continuation.ownerId || !continuation.generationParams || !continuation.apiKey) {
        message.ack()
        return
    }

    const params = continuation.generationParams
    const { generationAttempt, seed, dirtberrySourceDimensions } = await executeProviderGeneration(continuation.apiKey, params)

    if (!generationAttempt.success) {
        const canRetry = generationAttempt.retryable && workerAttempt < WORKER_RETRY_MAX_ATTEMPTS
        if (canRetry) {
            retryMessage(message, workerAttempt)
            return
        }

        await postConvexJsonWithRetry<FailBatchItemResponse>(env, "/workers/batch-item/fail", {
            batchJobId: message.body.batchJobId,
            itemIndex: message.body.itemIndex,
            claimToken,
            errorMessage: generationAttempt.errorMessage,
            errorCode: generationAttempt.statusCode,
            retryCount: workerAttempt > 1 ? workerAttempt - 1 : undefined,
        })

        message.ack()
        return
    }

    const response = generationAttempt.response
    const mediaBytes = new Uint8Array(await response.arrayBuffer())
    const contentType = response.headers.get("content-type") || "image/jpeg"

    const postFetchContinuation = await postConvexJsonWithRetry<ContinueBatchItemResponse>(env, "/workers/batch-item/continue", {
        batchJobId: message.body.batchJobId,
        itemIndex: message.body.itemIndex,
        claimToken,
    })

    if (!postFetchContinuation.canContinue || !postFetchContinuation.ownerId || !postFetchContinuation.generationParams || !postFetchContinuation.apiKey) {
        message.ack()
        return
    }

    const r2Key = await generateR2Key(postFetchContinuation.ownerId, contentType)
    const uploadResult = await uploadToR2(env, r2Key, mediaBytes, contentType)
    const dimensions = getCompletedDimensions(params, dirtberrySourceDimensions)

    let completeResult: CompleteBatchItemResponse | undefined
    try {
        completeResult = await postConvexJsonWithRetry<CompleteBatchItemResponse>(env, "/workers/batch-item/complete", {
            batchJobId: message.body.batchJobId,
            itemIndex: message.body.itemIndex,
            claimToken,
            r2Key: uploadResult.r2Key,
            url: uploadResult.url,
            width: dimensions.width,
            height: dimensions.height,
            seed,
            contentType,
            sizeBytes: uploadResult.sizeBytes,
            retryCount: workerAttempt > 1 ? workerAttempt - 1 : undefined,
        })
    } finally {
        if (completeResult?.completed !== true) {
            await deleteR2Object(env, uploadResult.r2Key)
        }
    }

    message.ack()
}
