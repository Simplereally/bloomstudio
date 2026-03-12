import { getQueueMessageLabel, isAuthorizedRequest, json, logWorkerEvent, readJsonBody } from "./core"
import type { DispatchRequestBody, Env } from "./types"

function readProp(value: object, key: string): unknown {
    return Reflect.get(value, key)
}

function isDispatchRequestBody(value: unknown): value is DispatchRequestBody {
    if (!value || typeof value !== "object") {
        return false
    }

    const jobType = readProp(value, "jobType")
    const attempt = readProp(value, "attempt")
    const enqueuedAt = readProp(value, "enqueuedAt")

    if (
        jobType === "single_generation" &&
        typeof readProp(value, "generationId") === "string" &&
        typeof attempt === "number" &&
        typeof enqueuedAt === "number"
    ) {
        return true
    }

    if (
        jobType === "batch_item" &&
        typeof readProp(value, "batchJobId") === "string" &&
        typeof readProp(value, "itemIndex") === "number" &&
        typeof attempt === "number" &&
        typeof enqueuedAt === "number"
    ) {
        return true
    }

    return (
        (jobType === "prompt_inference" ||
            jobType === "vision_analysis" ||
            jobType === "secondary_assets") &&
        typeof readProp(value, "imageId") === "string" &&
        typeof attempt === "number" &&
        typeof enqueuedAt === "number"
    )
}

export async function handleWorkerFetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/health") {
        return json({
            ok: true,
            service: "bloomstudio-worker",
            env: env.APP_ENV,
        })
    }

    if (url.pathname !== "/dispatch" || request.method !== "POST") {
        return json({ ok: false, error: "Not found" }, { status: 404 })
    }

    if (!isAuthorizedRequest(request, env)) {
        return json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await readJsonBody(request)
    if (!isDispatchRequestBody(body)) {
        return json({ ok: false, error: "Invalid dispatch payload" }, { status: 400 })
    }

    if (body.attempt < 1) {
        return json({ ok: false, error: "Invalid dispatch attempt" }, { status: 400 })
    }

    await env.GENERATION_QUEUE.send(body)

    const jobId = getQueueMessageLabel(body)
    logWorkerEvent(env, "log", "dispatch.enqueued", {
        jobType: body.jobType,
        jobId,
        attempt: body.attempt,
    })

    return json({
        ok: true,
        enqueued: true,
        jobType: body.jobType,
        jobId,
    })
}
