import {
    calculateWorkerQueueRetryDelaySeconds,
    WORKER_RETRY_MAX_ATTEMPTS,
} from "../../../lib/cloudflare-worker/retry"
import { getQueueMessageLabel, logWorkerEvent, postConvexJsonWithRetry } from "./core"
import { handleBatchItemMessage, handleSingleGenerationMessage } from "./generation"
import { handlePromptInferenceMessage, handleVisionAnalysisMessage } from "./moderation"
import { handleSecondaryAssetsMessage } from "./secondary-assets"
import type {
    Env,
    GenerationQueueMessage,
    QueueMessage,
    QueueMessageBatch,
} from "./types"

/**
 * Best-effort settlement for messages that have exhausted all retry attempts.
 * Calls the appropriate fail endpoint so the Convex row doesn't stay stuck
 * in a processing state. Uses a sentinel claim token since the real one is
 * scoped to the handler — the fail mutation will check the token and may
 * no-op if it doesn't match (e.g. the item was never claimed or was already
 * settled). This is intentionally best-effort; a background sweeper should
 * handle any remaining stuck items.
 */
async function settleMessageOnFinalAttempt(
    message: QueueMessage<GenerationQueueMessage>,
    env: Env,
    errorMessage: string,
): Promise<void> {
    try {
        const body = message.body
        if (body.jobType === "single_generation") {
            await postConvexJsonWithRetry(env, "/workers/single-generation/fail", {
                generationId: body.generationId,
                claimToken: "__queue_final_attempt__",
                errorMessage: `Queue exhausted after ${message.attempts} attempts: ${errorMessage}`,
                skipClaimTokenCheck: true,
            })
        } else if (body.jobType === "batch_item") {
            await postConvexJsonWithRetry(env, "/workers/batch-item/fail", {
                batchJobId: body.batchJobId,
                itemIndex: body.itemIndex,
                claimToken: "__queue_final_attempt__",
                errorMessage: `Queue exhausted after ${message.attempts} attempts: ${errorMessage}`,
                skipClaimTokenCheck: true,
            })
        }
        // Other job types (secondary_assets, prompt_inference, vision_analysis)
        // have their own idempotent settlement and don't leave rows stuck.
    } catch (settlementError) {
        logWorkerEvent(env, "error", "queue.settlement_failed", {
            jobType: message.body.jobType,
            jobId: getQueueMessageLabel(message.body),
            errorMessage: settlementError instanceof Error ? settlementError.message : "Unknown settlement error",
        })
    }
}

/**
 * Narrow a queue message to a specific job type.
 * Used after a switch guard has already verified the jobType at runtime.
 */
function narrowMessage<T extends GenerationQueueMessage["jobType"]>(
    message: QueueMessage<GenerationQueueMessage>,
    _jobType: T,
): QueueMessage<Extract<GenerationQueueMessage, { jobType: T }>> {
    return message as QueueMessage<Extract<GenerationQueueMessage, { jobType: T }>>
}

async function handleQueueMessage(message: QueueMessage<GenerationQueueMessage>, env: Env): Promise<void> {
    switch (message.body.jobType) {
        case "single_generation":
            await handleSingleGenerationMessage(narrowMessage(message, "single_generation"), env)
            return
        case "batch_item":
            await handleBatchItemMessage(narrowMessage(message, "batch_item"), env)
            return
        case "secondary_assets":
            await handleSecondaryAssetsMessage(narrowMessage(message, "secondary_assets"), env)
            return
        case "prompt_inference":
            await handlePromptInferenceMessage(narrowMessage(message, "prompt_inference"), env)
            return
        case "vision_analysis":
            await handleVisionAnalysisMessage(narrowMessage(message, "vision_analysis"), env)
            return
        default: {
            const _exhaustive: never = message.body
            logWorkerEvent(env, "error", "queue.unknown_job_type", {
                jobType: (_exhaustive as GenerationQueueMessage).jobType,
            })
            message.ack()
        }
    }
}

export async function handleQueueBatch(batch: QueueMessageBatch<GenerationQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
        try {
            await handleQueueMessage(message, env)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown queue processing error"

            logWorkerEvent(env, "error", "queue.processing_failed", {
                jobType: message.body.jobType,
                jobId: getQueueMessageLabel(message.body),
                attempts: message.attempts,
                errorMessage,
            })

            if (message.attempts < WORKER_RETRY_MAX_ATTEMPTS) {
                message.retry({
                    delaySeconds: calculateWorkerQueueRetryDelaySeconds(message.attempts),
                })
                continue
            }

            // Final attempt exhausted — try to settle the Convex row so it
            // doesn't stay stuck in processing state
            await settleMessageOnFinalAttempt(message, env, errorMessage)
            message.ack()
        }
    }
}
