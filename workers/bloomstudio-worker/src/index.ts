import { handleWorkerFetch } from "./http"
import { handleQueueBatch } from "./queue"
import type { Env, GenerationQueueMessage, WorkerHandler } from "./types"

const worker: WorkerHandler<Env, GenerationQueueMessage> = {
    fetch: handleWorkerFetch,
    queue: handleQueueBatch,
}

export default worker
