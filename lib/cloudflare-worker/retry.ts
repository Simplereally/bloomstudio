export const WORKER_RETRY_MAX_ATTEMPTS = 5
export const WORKER_RETRY_BASE_DELAY_MS = 2_000
export const WORKER_RETRY_MAX_DELAY_MS = 30_000

type RetryDelayOptions = {
    jitter?: boolean
}

export function calculateWorkerRetryDelayMs(
    attempt: number,
    { jitter = false }: RetryDelayOptions = {}
): number {
    const exponentialDelay = WORKER_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1)

    if (!jitter) {
        return Math.min(WORKER_RETRY_MAX_DELAY_MS, exponentialDelay)
    }

    const jitteredDelay = exponentialDelay * (0.75 + Math.random() * 0.5)
    return Math.min(WORKER_RETRY_MAX_DELAY_MS, Math.round(jitteredDelay))
}

export function calculateWorkerQueueRetryDelaySeconds(attempt: number): number {
    return Math.max(1, Math.round(calculateWorkerRetryDelayMs(attempt, { jitter: true }) / 1_000))
}
