import type { Env, GenerationQueueMessage } from "./types"

export const WORKER_SECRET_HEADER = "x-bloomstudio-worker-secret"
const CONVEX_CALLBACK_TIMEOUT_MS = 10_000

export function json(data: unknown, init?: ResponseInit): Response {
    return Response.json(data, init)
}

export function logWorkerEvent(
    env: Env,
    level: "log" | "warn" | "error",
    event: string,
    fields: Record<string, unknown>
): void {
    const entry = {
        service: "bloomstudio-worker",
        env: env.APP_ENV,
        event,
        ...fields,
    }

    console[level](JSON.stringify(entry))
}

export function getRequiredConfig(env: Env) {
    if (!env.CONVEX_SITE_URL || !env.BLOOMSTUDIO_WORKER_SHARED_SECRET || !env.R2_PUBLIC_URL) {
        throw new Error(
            "Missing Worker configuration. Expected CONVEX_SITE_URL, BLOOMSTUDIO_WORKER_SHARED_SECRET, and R2_PUBLIC_URL."
        )
    }

    return {
        convexSiteUrl: env.CONVEX_SITE_URL.replace(/\/$/, ""),
        sharedSecret: env.BLOOMSTUDIO_WORKER_SHARED_SECRET,
        r2PublicUrl: env.R2_PUBLIC_URL.replace(/\/$/, ""),
    }
}

export function getRequiredMediaTransformsConfig(env: Env) {
    if (!env.MEDIA_TRANSFORMS_BASE_URL) {
        throw new Error("Missing Worker configuration. Expected MEDIA_TRANSFORMS_BASE_URL.")
    }

    return {
        mediaTransformsBaseUrl: env.MEDIA_TRANSFORMS_BASE_URL.replace(/\/$/, ""),
    }
}

export async function readJsonBody(request: Request): Promise<unknown> {
    try {
        return await request.json()
    } catch {
        return null
    }
}

export function isAuthorizedRequest(request: Request, env: Env): boolean {
    const expected = env.BLOOMSTUDIO_WORKER_SHARED_SECRET
    const provided = request.headers.get(WORKER_SECRET_HEADER)
    return !!expected && !!provided && provided === expected
}

export async function postConvexJson<TResponse>(
    env: Env,
    path: string,
    body: unknown,
    timeoutMs = CONVEX_CALLBACK_TIMEOUT_MS
): Promise<TResponse> {
    const { convexSiteUrl, sharedSecret } = getRequiredConfig(env)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    let response: Response
    try {
        response = await fetch(`${convexSiteUrl}${path}`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                [WORKER_SECRET_HEADER]: sharedSecret,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        })
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Convex callback ${path} timed out after ${timeoutMs}ms`)
        }

        throw error
    } finally {
        clearTimeout(timeoutId)
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(
            `Convex callback ${path} failed with ${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
        )
    }

    return (await response.json()) as TResponse
}

export async function postConvexJsonWithRetry<TResponse>(
    env: Env,
    path: string,
    body: unknown,
    maxAttempts = 3
): Promise<TResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await postConvexJson<TResponse>(env, path, body)
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown Convex callback error")
            if (attempt === maxAttempts) {
                break
            }
        }
    }

    throw lastError ?? new Error("Unknown Convex callback error")
}

export function getQueueMessageLabel(message: GenerationQueueMessage): string {
    if (message.jobType === "single_generation") {
        return message.generationId
    }

    if (message.jobType === "batch_item") {
        return `${message.batchJobId}:${message.itemIndex}`
    }

    return message.imageId
}
