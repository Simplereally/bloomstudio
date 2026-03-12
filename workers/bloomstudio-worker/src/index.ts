import { handleWorkerFetch } from "./http"
import { handleQueueBatch } from "./queue"
import type { Env, GenerationQueueMessage } from "./types"

const worker: ExportedHandler<Env, GenerationQueueMessage> = {
    fetch: handleWorkerFetch,
    queue: handleQueueBatch,
}

export default worker
