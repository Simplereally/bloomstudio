import {
    calculateWorkerQueueRetryDelaySeconds,
    WORKER_RETRY_MAX_ATTEMPTS,
} from "../../../lib/cloudflare-worker/retry"
import {
    getRequiredMediaTransformsConfig,
    logWorkerEvent,
    postConvexJsonWithRetry,
} from "./core"
import type { Env, GenerationQueueMessage, QueueMessage, WorkerRequestInit } from "./types"

const SECONDARY_ASSET_TIMEOUT_MS = 30_000
const VIDEO_THUMBNAIL_SIZE = 128
const VIDEO_PREVIEW_WIDTH = 480
const VIDEO_THUMBNAIL_TIME = "1s"

type ClaimSecondaryAssetsResponse = {
    claimed: boolean
}

type ContinueSecondaryAssetsResponse = {
    canContinue: boolean
    videoUrl?: string
    r2Key?: string
    contentType?: string
}

type CompleteSecondaryAssetsResponse = {
    completed: boolean
    duplicate: boolean
}

type FailSecondaryAssetsResponse = {
    failed: boolean
    duplicate: boolean
}

type SecondaryAssetsMessage = QueueMessage<Extract<GenerationQueueMessage, { jobType: "secondary_assets" }>>

class SecondaryAssetsError extends Error {
    readonly retryable: boolean
    readonly stage: string

    constructor(stage: string, message: string, retryable = true) {
        super(message)
        this.name = "SecondaryAssetsError"
        this.retryable = retryable
        this.stage = stage
    }
}

function normalizeSecondaryAssetsError(error: unknown): SecondaryAssetsError {
    if (error instanceof SecondaryAssetsError) {
        return error
    }

    if (error instanceof Error) {
        return new SecondaryAssetsError("thumbnail_capture", error.message, true)
    }

    return new SecondaryAssetsError("thumbnail_capture", "Unknown secondary assets error", true)
}

function buildMediaTransformUrl(env: Env, sourceUrl: string, operations: string[]): string {
    let mediaTransformsBaseUrl: string
    try {
        mediaTransformsBaseUrl = getRequiredMediaTransformsConfig(env).mediaTransformsBaseUrl
    } catch (error) {
        throw new SecondaryAssetsError(
            "media_transform_config",
            error instanceof Error ? error.message : "Missing media transform configuration",
            false
        )
    }

    let parsedSourceUrl: URL
    try {
        parsedSourceUrl = new URL(sourceUrl)
    } catch {
        throw new SecondaryAssetsError("media_transform_config", "Invalid source video URL for media transform", false)
    }

    if (parsedSourceUrl.protocol !== "https:") {
        throw new SecondaryAssetsError("media_transform_config", "Media transforms require an HTTPS source video URL", false)
    }

    return `${mediaTransformsBaseUrl}/cdn-cgi/media/${operations.join(",")}/${parsedSourceUrl.toString()}`
}

function buildVideoThumbnailUrl(env: Env, videoUrl: string): string {
    return buildMediaTransformUrl(env, videoUrl, [
        "mode=frame",
        `time=${VIDEO_THUMBNAIL_TIME}`,
        `width=${VIDEO_THUMBNAIL_SIZE}`,
        `height=${VIDEO_THUMBNAIL_SIZE}`,
        "fit=cover",
        "format=jpg",
    ])
}

function buildVideoPreviewUrl(env: Env, videoUrl: string): string {
    return buildMediaTransformUrl(env, videoUrl, [
        "mode=video",
        `width=${VIDEO_PREVIEW_WIDTH}`,
        "fit=scale-down",
        "quality=75",
    ])
}

async function verifyMediaTransformResponse(url: string, expectedContentTypePrefix: string): Promise<void> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SECONDARY_ASSET_TIMEOUT_MS)
    let response: Response

    try {
        const requestInit = {
            method: "GET",
            headers: {
                accept:
                    expectedContentTypePrefix === "image/"
                        ? "image/jpeg,image/*;q=0.9,*/*;q=0.1"
                        : "video/*;q=0.9,*/*;q=0.1",
                ...(expectedContentTypePrefix === "video/" ? { range: "bytes=0-0" } : {}),
            },
            cf: {
                cacheTtl: 60 * 60,
                cacheEverything: true,
            },
            signal: controller.signal,
        } satisfies WorkerRequestInit

        response = await fetch(url, requestInit)
    } catch (error) {
        clearTimeout(timeoutId)
        throw new SecondaryAssetsError(
            "media_transform_probe",
            error instanceof Error && error.name === "AbortError"
                ? `Media transform probe timed out after ${SECONDARY_ASSET_TIMEOUT_MS}ms`
                : error instanceof Error
                    ? error.message
                    : "Failed to reach Cloudflare media transform",
            true
        )
    }
    clearTimeout(timeoutId)

    if (!response.ok) {
        const retryable = response.status >= 500 || response.status === 408 || response.status === 429
        const errorText = await response.text().catch(() => "")
        throw new SecondaryAssetsError(
            "media_transform_probe",
            `Media transform probe failed with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : ""}`,
            retryable
        )
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
    if (!contentType.startsWith(expectedContentTypePrefix)) {
        throw new SecondaryAssetsError(
            "media_transform_probe",
            `Media transform returned unexpected content type: ${contentType || "unknown"}`,
            false
        )
    }

    const bytes = await response.arrayBuffer()
    if (bytes.byteLength === 0) {
        throw new SecondaryAssetsError("media_transform_probe", "Media transform returned an empty thumbnail", true)
    }
}

function retryMessage(message: SecondaryAssetsMessage, attempt: number): void {
    message.retry({
        delaySeconds: calculateWorkerQueueRetryDelaySeconds(attempt),
    })
}

export async function handleSecondaryAssetsMessage(message: SecondaryAssetsMessage, env: Env): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)
    const startedAt = Date.now()

    logWorkerEvent(env, "log", "secondary_assets.started", {
        imageId: message.body.imageId,
        workerAttempt,
    })

    const claimResult = await postConvexJsonWithRetry<ClaimSecondaryAssetsResponse>(env, "/workers/secondary-assets/claim", {
        imageId: message.body.imageId,
        claimToken,
        workerAttempt,
    })

    if (!claimResult.claimed) {
        logWorkerEvent(env, "log", "secondary_assets.skipped", {
            imageId: message.body.imageId,
            workerAttempt,
            reason: "claim_rejected",
        })
        message.ack()
        return
    }

    const continuation = await postConvexJsonWithRetry<ContinueSecondaryAssetsResponse>(env, "/workers/secondary-assets/continue", {
        imageId: message.body.imageId,
        claimToken,
    })

    if (!continuation.canContinue || !continuation.videoUrl || !continuation.r2Key || !continuation.contentType?.startsWith("video/")) {
        logWorkerEvent(env, "warn", "secondary_assets.skipped", {
            imageId: message.body.imageId,
            workerAttempt,
            reason: "invalid_continuation",
        })
        message.ack()
        return
    }

    try {
        const thumbnailUrl = buildVideoThumbnailUrl(env, continuation.videoUrl)
        const previewUrl = buildVideoPreviewUrl(env, continuation.videoUrl)
        let completedPreviewUrl: string | undefined = previewUrl

        await verifyMediaTransformResponse(thumbnailUrl, "image/")

        try {
            await verifyMediaTransformResponse(previewUrl, "video/")
        } catch (error) {
            const normalizedPreviewError = normalizeSecondaryAssetsError(error)
            completedPreviewUrl = undefined

            logWorkerEvent(env, normalizedPreviewError.retryable ? "warn" : "error", "secondary_assets.preview_skipped", {
                imageId: message.body.imageId,
                workerAttempt,
                stage: normalizedPreviewError.stage,
                retryable: normalizedPreviewError.retryable,
                errorMessage: normalizedPreviewError.message,
            })
        }

        const completeResult = await postConvexJsonWithRetry<CompleteSecondaryAssetsResponse>(env, "/workers/secondary-assets/complete", {
            imageId: message.body.imageId,
            claimToken,
            thumbnailUrl,
            previewUrl: completedPreviewUrl,
        })

        logWorkerEvent(env, "log", "secondary_assets.completed", {
            imageId: message.body.imageId,
            workerAttempt,
            thumbnailUrl,
            previewUrl: completedPreviewUrl,
            durationMs: Date.now() - startedAt,
            duplicate: completeResult.duplicate,
            completed: completeResult.completed,
        })

        message.ack()
    } catch (error) {
        const normalizedError = normalizeSecondaryAssetsError(error)
        const canRetry = normalizedError.retryable && workerAttempt < WORKER_RETRY_MAX_ATTEMPTS

        logWorkerEvent(env, canRetry ? "warn" : "error", "secondary_assets.failed", {
            imageId: message.body.imageId,
            workerAttempt,
            durationMs: Date.now() - startedAt,
            canRetry,
            stage: normalizedError.stage,
            retryable: normalizedError.retryable,
            errorMessage: normalizedError.message,
        })

        if (canRetry) {
            retryMessage(message, workerAttempt)
            return
        }

        await postConvexJsonWithRetry<FailSecondaryAssetsResponse>(env, "/workers/secondary-assets/fail", {
            imageId: message.body.imageId,
            claimToken,
            errorMessage: normalizedError.message,
        })

        message.ack()
    }
}
