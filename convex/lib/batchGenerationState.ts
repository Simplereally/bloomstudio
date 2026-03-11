export type BatchLifecycleStatus = "pending" | "processing" | "paused" | "completed" | "cancelled" | "failed"

export type ResumeBatchDecision = {
    canSchedule: boolean
    itemIndex: number | null
    nextInFlightCount: number
    reason: "in_flight" | "no_remaining_work" | null
}

export function getResumeBatchDecision(state: {
    currentIndex: number
    totalCount: number
    inFlightCount?: number
    settledItemIndexes?: number[]
}): ResumeBatchDecision {
    const inFlightCount = state.inFlightCount ?? 0
    if (inFlightCount > 0) {
        return {
            canSchedule: false,
            itemIndex: null,
            nextInFlightCount: inFlightCount,
            reason: "in_flight",
        }
    }

    const settledItemIndexes = state.settledItemIndexes ?? []
    let itemIndex = state.currentIndex

    while (settledItemIndexes.includes(itemIndex) && itemIndex < state.totalCount) {
        itemIndex += 1
    }

    if (itemIndex >= state.totalCount) {
        return {
            canSchedule: false,
            itemIndex: null,
            nextInFlightCount: inFlightCount,
            reason: "no_remaining_work",
        }
    }

    return {
        canSchedule: true,
        itemIndex,
        nextInFlightCount: inFlightCount + 1,
        reason: null,
    }
}

export function buildRecordBatchItemResultTransition<ImageId>(state: {
    completedCount: number
    failedCount: number
    imageIds: ImageId[]
    inFlightCount?: number
    settledItemIndexes?: number[]
    status: BatchLifecycleStatus
    totalCount: number
}, result: {
    itemIndex: number
    success: boolean
    imageId?: ImageId
    errorCode?: number
    retryCount?: number
}) {
    const inFlightCount = state.inFlightCount ?? 1
    const nextInFlightCount = Math.max(0, inFlightCount - 1)
    const settledItemIndexes = state.settledItemIndexes ?? []

    if (settledItemIndexes.includes(result.itemIndex)) {
        return {
            isDuplicate: true,
            shouldDelete: false,
            updates: {
                inFlightCount: nextInFlightCount,
            },
        }
    }

    const updates: {
        completedCount?: number
        currentItemRetryCount?: number
        failedCount?: number
        imageIds?: ImageId[]
        inFlightCount: number
        lastErrorCode?: number
        settledItemIndexes: number[]
        status?: Extract<BatchLifecycleStatus, "processing">
    } = {
        inFlightCount: nextInFlightCount,
        settledItemIndexes: [...settledItemIndexes, result.itemIndex],
    }

    if (result.success) {
        updates.completedCount = state.completedCount + 1
        if (result.imageId !== undefined) {
            updates.imageIds = [...state.imageIds, result.imageId]
        }
    } else {
        updates.failedCount = state.failedCount + 1
        if (result.errorCode !== undefined) {
            updates.lastErrorCode = result.errorCode
        }
    }

    if (result.retryCount !== undefined && result.retryCount > 0) {
        updates.currentItemRetryCount = result.retryCount
    }

    const totalProcessed =
        (updates.completedCount ?? state.completedCount) +
        (updates.failedCount ?? state.failedCount)

    if (totalProcessed < state.totalCount && state.status === "pending") {
        updates.status = "processing"
    }

    return {
        isDuplicate: false,
        shouldDelete: totalProcessed >= state.totalCount,
        updates,
    }
}
