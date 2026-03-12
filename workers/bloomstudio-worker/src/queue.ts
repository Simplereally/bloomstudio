import {
    calculateWorkerQueueRetryDelaySeconds,
    WORKER_RETRY_MAX_ATTEMPTS,
} from "../../../lib/cloudflare-worker/retry"
import { getQueueMessageLabel, logWorkerEvent } from "./core"
import { handleBatchItemMessage, handleSingleGenerationMessage } from "./generation"
import { handlePromptInferenceMessage, handleVisionAnalysisMessage } from "./moderation"
import { handleSecondaryAssetsMessage } from "./secondary-assets"
import type { Env, GenerationQueueMessage } from "./types"

async function handleQueueMessage(message: Message<GenerationQueueMessage>, env: Env): Promise<void> {
    switch (message.body.jobType) {
        case "single_generation":
            await handleSingleGenerationMessage(message as Message<Extract<GenerationQueueMessage, { jobType: "single_generation" }>>, env)
            return
        case "batch_item":
            await handleBatchItemMessage(message as Message<Extract<GenerationQueueMessage, { jobType: "batch_item" }>>, env)
            return
        case "secondary_assets":
            await handleSecondaryAssetsMessage(message as Message<Extract<GenerationQueueMessage, { jobType: "secondary_assets" }>>, env)
            return
        case "prompt_inference":
            await handlePromptInferenceMessage(message as Message<Extract<GenerationQueueMessage, { jobType: "prompt_inference" }>>, env)
            return
        case "vision_analysis":
            await handleVisionAnalysisMessage(message as Message<Extract<GenerationQueueMessage, { jobType: "vision_analysis" }>>, env)
            return
    }
}

export async function handleQueueBatch(batch: MessageBatch<GenerationQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
        try {
            await handleQueueMessage(message, env)
        } catch (error) {
            logWorkerEvent(env, "error", "queue.processing_failed", {
                jobType: message.body.jobType,
                jobId: getQueueMessageLabel(message.body),
                attempts: message.attempts,
                errorMessage: error instanceof Error ? error.message : "Unknown queue processing error",
            })

            if (message.attempts < WORKER_RETRY_MAX_ATTEMPTS) {
                message.retry({
                    delaySeconds: calculateWorkerQueueRetryDelaySeconds(message.attempts),
                })
                continue
            }

            message.ack()
        }
    }
}
