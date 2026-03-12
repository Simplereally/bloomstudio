import { buildPollinationsUrl, fetchPollinationsWithTimeout, POLLINATIONS_FETCH_TIMEOUT_MS } from "../../../convex/lib/pollinations"

type AppEnv = "development" | "production"
type ModerationStage = "prompt_inference" | "vision_analysis"
type ProviderName = "groq" | "openrouter"

type SingleGenerationDispatchRequestBody = {
    jobType: "single_generation"
    generationId: string
    apiKey: string
    attempt: number
    enqueuedAt: number
}

type BatchItemDispatchRequestBody = {
    jobType: "batch_item"
    batchJobId: string
    itemIndex: number
    apiKey: string
    attempt: number
    enqueuedAt: number
}

type PromptInferenceDispatchRequestBody = {
    jobType: "prompt_inference"
    imageId: string
    attempt: number
    enqueuedAt: number
}

type VisionAnalysisDispatchRequestBody = {
    jobType: "vision_analysis"
    imageId: string
    attempt: number
    enqueuedAt: number
}

type SecondaryAssetsDispatchRequestBody = {
    jobType: "secondary_assets"
    imageId: string
    attempt: number
    enqueuedAt: number
}

type DispatchRequestBody =
    | SingleGenerationDispatchRequestBody
    | BatchItemDispatchRequestBody
    | PromptInferenceDispatchRequestBody
    | VisionAnalysisDispatchRequestBody
    | SecondaryAssetsDispatchRequestBody

type GenerationQueueMessage = DispatchRequestBody

type GenerationParams = {
    prompt: string
    negativePrompt?: string
    model?: string
    width?: number
    height?: number
    seed?: number
    enhance?: boolean
    private?: boolean
    safe?: boolean
    image?: string
    duration?: number
    audio?: boolean
    aspectRatio?: string
    lastFrameImage?: string
    quality?: string
}

type ContinueGenerationResponse = {
    canContinue: boolean
    ownerId?: string
    generationParams?: GenerationParams
}

type ClaimGenerationResponse = {
    claimed: boolean
}

type CompleteGenerationResponse = {
    completed: boolean
    duplicate: boolean
    imageId?: string
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
}

type CompleteBatchItemResponse = {
    completed: boolean
    duplicate: boolean
    imageId?: string
}

type FailBatchItemResponse = {
    failed: boolean
    duplicate: boolean
}

type ClaimModerationResponse = {
    claimed: boolean
}

type ContinueModerationResponse = {
    canContinue: boolean
    prompt?: string
    imageUrl?: string
}

type CompletePromptInferenceResponse = {
    completed: boolean
    duplicate: boolean
    escalated: boolean
}

type FailPromptInferenceResponse = {
    failed: boolean
    duplicate: boolean
    escalated: boolean
}

type CompleteVisionAnalysisResponse = {
    completed: boolean
    duplicate: boolean
}

type FailVisionAnalysisResponse = {
    released: boolean
    duplicate: boolean
}

type ClaimSecondaryAssetsResponse = {
    claimed: boolean
}

type ContinueSecondaryAssetsResponse = {
    canContinue: boolean
    videoUrl?: string
    r2Key?: string
    contentType?: string
    dispatchStatus?: "pending" | "dispatched" | "processing" | "completed" | "failed" | "cancelled"
}

type CompleteSecondaryAssetsResponse = {
    completed: boolean
    duplicate: boolean
}

type FailSecondaryAssetsResponse = {
    failed: boolean
    duplicate: boolean
}

type PromptInferenceResult = {
    isSensitive: boolean
    category: "explicit" | "suggestive" | "safe"
    confidence: number
    reasoning: string
}

type DecisionResult = {
    action: "tag_sensitive" | "tag_safe" | "escalate_to_vision"
    inferenceResult: PromptInferenceResult
}

type VisionContentAnalysisResult = {
    nudity: "none" | "full"
    sexual_content: "none" | "suggestive" | "explicit"
    violence: "none" | "mild" | "graphic"
    confidence: number
    reasoning: string
    provider: ProviderName
}

type VisionProviderFailure = {
    provider: ProviderName
    errorMessage: string
    rateLimited: boolean
    retryable: boolean
}

type VisionAttemptResult =
    | { success: true; analysis: VisionContentAnalysisResult }
    | { success: false; errorMessage: string; rateLimited: boolean; retryable: boolean }

type Env = {
    APP_ENV: AppEnv
    CONVEX_SITE_URL?: string
    BLOOMSTUDIO_WORKER_SHARED_SECRET?: string
    R2_PUBLIC_URL?: string
    MEDIA_TRANSFORMS_BASE_URL?: string
    CEREBRAS_API_KEY?: string
    GROQ_API_KEY?: string
    OPENROUTER_API_KEY?: string
    GENERATION_QUEUE: Queue<GenerationQueueMessage>
    MEDIA_BUCKET: R2Bucket
}

const WORKER_SECRET_HEADER = "x-bloomstudio-worker-secret"
const GENERATION_MAX_ATTEMPTS = 5
const PROVIDER_TIMEOUT_MS = 30_000
const SECONDARY_ASSET_TIMEOUT_MS = 30_000
const VIDEO_THUMBNAIL_SIZE = 128
const VIDEO_PREVIEW_WIDTH = 480
const VIDEO_THUMBNAIL_TIME = "1s"
const CEREBRAS_MODEL = "llama3.1-8b"
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
const OPENROUTER_VISION_MODEL = "qwen/qwen-2.5-vl-7b-instruct:free"
const CONTENT_ANALYSIS_PROMPT = `Analyze this image for content appropriateness. Classify:
1. Nudity: none/full ("full" = sexual organs visible such as nipples, genitals, anus OR subject is entirely nude with zero clothing. Bikinis, lingerie, or partial skin showing is "none".)
2. Sexual content: none/suggestive/explicit
3. Violence: none/mild/graphic

Respond ONLY with valid JSON:
{"nudity":"none|full","sexual_content":"none|suggestive|explicit","violence":"none|mild|graphic","confidence":0.0-1.0,"reasoning":"brief explanation"}`
const PROMPT_INFERENCE_SYSTEM_PROMPT = `
# SYSTEM ROLE
You are a high-precision safety moderation agent for an AI image generation platform.

# MISSION
Analyze the user's generation prompt provided at the end of this message. You must determine if the resulting image will likely contain NSFW (Not Safe For Work), sensitive, or explicit content.

# CLASSIFICATION RULES
1. **EXPLICIT**: Direct and clear requests for sexual acts, full genitalia, pornographic themes, or extreme graphic violence.
2. **SUGGESTIVE**: "Bypassing" language, indirect requests for nudity (e.g., "scantily clad", "unzipping", "wet clothes"), provocative posing, or fetish-adjacent descriptions that walk the line of acceptability.
3. **SAFE**: Everything else, including artistic nudity in a clearly non-sexual/classical context or standard cinematic portraits.

# OUTPUT PROTOCOL
- You MUST respond ONLY with a raw JSON object.
- Do NOT include any preamble, markdown formatting, or "Here is your analysis" text.
- If a prompt is ambiguous but leans towards provocative, classify as "SUGGESTIVE".

# REQUIRED JSON SCHEMA
{
  "isSensitive": boolean,
  "category": "explicit" | "suggestive" | "safe",
  "confidence": number,
  "reasoning": "string"
}
`.trim()

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

function json(data: unknown, init?: ResponseInit): Response {
    return Response.json(data, init)
}

function logWorkerEvent(
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

function normalizeSecondaryAssetsError(error: unknown): SecondaryAssetsError {
    if (error instanceof SecondaryAssetsError) {
        return error
    }

    if (error instanceof Error) {
        if (error.name === "TimeoutError") {
            return new SecondaryAssetsError("thumbnail_capture", error.message, true)
        }

        return new SecondaryAssetsError("thumbnail_capture", error.message, true)
    }

    return new SecondaryAssetsError("thumbnail_capture", "Unknown secondary assets error", true)
}

function isDispatchRequestBody(value: unknown): value is DispatchRequestBody {
    if (!value || typeof value !== "object") {
        return false
    }

    const body = value as Record<string, unknown>
    if (
        body.jobType === "single_generation" &&
        typeof body.generationId === "string" &&
        typeof body.apiKey === "string" &&
        typeof body.attempt === "number" &&
        typeof body.enqueuedAt === "number"
    ) {
        return true
    }

    if (
        body.jobType === "batch_item" &&
        typeof body.batchJobId === "string" &&
        typeof body.itemIndex === "number" &&
        typeof body.apiKey === "string" &&
        typeof body.attempt === "number" &&
        typeof body.enqueuedAt === "number"
    ) {
        return true
    }

    return (
        (body.jobType === "prompt_inference" ||
            body.jobType === "vision_analysis" ||
            body.jobType === "secondary_assets") &&
        typeof body.imageId === "string" &&
        typeof body.attempt === "number" &&
        typeof body.enqueuedAt === "number"
    )
}

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

function getDirtberrySourceDimensions() {
    return {
        width: 832,
        height: 1216,
    }
}

function calculateBackoffDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
    const exponentialDelay = baseDelayMs * 2 ** Math.max(0, attempt - 1)
    const jitter = exponentialDelay * (0.75 + Math.random() * 0.5)
    return Math.min(maxDelayMs, Math.round(jitter))
}

function getRequiredConfig(env: Env) {
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

function getRequiredMediaTransformsConfig(env: Env) {
    if (!env.MEDIA_TRANSFORMS_BASE_URL) {
        throw new SecondaryAssetsError(
            "media_transform_config",
            "Missing Worker configuration. Expected MEDIA_TRANSFORMS_BASE_URL.",
            false
        )
    }

    return {
        mediaTransformsBaseUrl: env.MEDIA_TRANSFORMS_BASE_URL.replace(/\/$/, ""),
    }
}

async function readJsonBody(request: Request): Promise<unknown> {
    try {
        return await request.json()
    } catch {
        return null
    }
}

function isAuthorizedRequest(request: Request, env: Env): boolean {
    const expected = env.BLOOMSTUDIO_WORKER_SHARED_SECRET
    const provided = request.headers.get(WORKER_SECRET_HEADER)
    return !!expected && !!provided && provided === expected
}

async function postConvexJson<TResponse>(env: Env, path: string, body: unknown): Promise<TResponse> {
    const { convexSiteUrl, sharedSecret } = getRequiredConfig(env)
    const response = await fetch(`${convexSiteUrl}${path}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            [WORKER_SECRET_HEADER]: sharedSecret,
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(
            `Convex callback ${path} failed with ${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
        )
    }

    return (await response.json()) as TResponse
}

async function postConvexJsonWithRetry<TResponse>(
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

function getQueueMessageLabel(message: GenerationQueueMessage): string {
    if (message.jobType === "single_generation") {
        return message.generationId
    }
    if (message.jobType === "batch_item") {
        return `${message.batchJobId}:${message.itemIndex}`
    }

    return message.imageId
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

function buildMediaTransformUrl(env: Env, sourceUrl: string, operations: string[]): string {
    const { mediaTransformsBaseUrl } = getRequiredMediaTransformsConfig(env)

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
        response = await fetch(url, {
            method: "GET",
            headers: {
                accept: expectedContentTypePrefix === "image/"
                    ? "image/jpeg,image/*;q=0.9,*/*;q=0.1"
                    : "video/*;q=0.9,*/*;q=0.1",
                ...(expectedContentTypePrefix === "video/" ? { range: "bytes=0-0" } : {}),
            },
            cf: {
                cacheTtl: 60 * 60,
                cacheEverything: true,
            },
            signal: controller.signal,
        })
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

    const thumbnailBytes = await response.arrayBuffer()
    if (thumbnailBytes.byteLength === 0) {
        throw new SecondaryAssetsError("media_transform_probe", "Media transform returned an empty thumbnail", true)
    }
}

async function executeProviderGeneration(apiKey: string, generationParams: GenerationParams) {
    const shouldCropDirtberry = isDirtberryModel(generationParams.model)
    const dirtberrySourceDimensions = shouldCropDirtberry ? getDirtberrySourceDimensions() : null
    const int32Max = 2147483647
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

async function fetchJsonWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return response
    } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Request timed out after ${timeoutMs}ms`)
        }
        throw error
    }
}

function parsePromptInferenceResult(rawText: string): PromptInferenceResult {
    let cleanText = rawText.trim()
    if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "")
    } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```/, "").replace(/```$/, "")
    }
    cleanText = cleanText.trim()

    const parsed = JSON.parse(cleanText) as Record<string, unknown>
    if (typeof parsed.isSensitive !== "boolean") {
        throw new Error("Missing or invalid 'isSensitive'")
    }
    if (typeof parsed.confidence !== "number" || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error("Missing or invalid 'confidence'")
    }
    if (typeof parsed.reasoning !== "string") {
        throw new Error("Missing or invalid 'reasoning'")
    }
    if (!["explicit", "suggestive", "safe"].includes(String(parsed.category))) {
        throw new Error("Invalid 'category'")
    }

    return {
        isSensitive: parsed.isSensitive,
        category: parsed.category as PromptInferenceResult["category"],
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
    }
}

function decidePromptSensitivity(inference: PromptInferenceResult): DecisionResult {
    const { category, confidence } = inference
    if (category === "explicit" && confidence >= 0.7) {
        return { action: "tag_sensitive", inferenceResult: inference }
    }
    if (category === "suggestive" && confidence >= 0.85) {
        return { action: "tag_sensitive", inferenceResult: inference }
    }
    if (category === "safe" && confidence >= 0.85) {
        return { action: "tag_safe", inferenceResult: inference }
    }

    return { action: "escalate_to_vision", inferenceResult: inference }
}

async function analyzePromptWithCerebrasWorker(env: Env, prompt: string): Promise<PromptInferenceResult> {
    if (!env.CEREBRAS_API_KEY) {
        throw new Error("CEREBRAS_API_KEY is not configured for the worker")
    }

    const response = await fetchJsonWithTimeout(
        "https://api.cerebras.ai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.CEREBRAS_API_KEY}`,
            },
            body: JSON.stringify({
                model: CEREBRAS_MODEL,
                messages: [
                    { role: "system", content: PROMPT_INFERENCE_SYSTEM_PROMPT },
                    { role: "user", content: `\n# INPUT PROMPT\n${prompt}` },
                ],
                temperature: 0.1,
                max_tokens: 256,
                response_format: { type: "json_object" },
            }),
        },
        PROVIDER_TIMEOUT_MS
    )

    if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        throw new Error(`Cerebras API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`)
    }

    const json = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) {
        throw new Error("Empty response from Cerebras")
    }

    return parsePromptInferenceResult(content)
}

function normalizeLevel<T extends string>(value: unknown, allowed: T[]): T {
    if (typeof value === "string" && allowed.includes(value.toLowerCase() as T)) {
        return value.toLowerCase() as T
    }
    return allowed[0]
}

function parseVisionResponse(text: string): Omit<VisionContentAnalysisResult, "provider"> {
    let jsonContent = text.trim()
    jsonContent = jsonContent.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim()
    const parsed = JSON.parse(jsonContent) as Record<string, unknown>
    const rawNudity = typeof parsed.nudity === "string" ? parsed.nudity.toLowerCase() : "none"

    return {
        nudity: rawNudity === "full" ? "full" : "none",
        sexual_content: normalizeLevel(parsed.sexual_content, ["none", "suggestive", "explicit"]),
        violence: normalizeLevel(parsed.violence, ["none", "mild", "graphic"]),
        confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
        reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "No reasoning provided",
    }
}

function calculateSensitivityScore(analysis: Omit<VisionContentAnalysisResult, "provider">): number {
    let score = 0
    if (analysis.nudity === "full") score += 0.9
    if (analysis.sexual_content === "suggestive") score += 0.3
    if (analysis.sexual_content === "explicit") score += 0.9
    if (analysis.violence === "mild") score += 0.2
    if (analysis.violence === "graphic") score += 0.7
    return Math.min(score, 1)
}

function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500
}

async function recordProviderRateLimit(env: Env, provider: ProviderName, errorBody: string): Promise<void> {
    try {
        await postConvexJsonWithRetry<{ ok: boolean }>(env, "/workers/provider-health/rate-limit", {
            provider,
            errorBody,
        })
    } catch (error) {
        console.error(`[BloomStudioWorker:${env.APP_ENV}] Failed to record ${provider} rate limit`, error)
    }
}

async function analyzeWithGroqWorker(env: Env, imageUrl: string): Promise<VisionAttemptResult> {
    if (!env.GROQ_API_KEY) {
        return {
            success: false,
            errorMessage: "GROQ_API_KEY is not configured for the worker",
            rateLimited: false,
            retryable: false,
        }
    }

    try {
        const response = await fetchJsonWithTimeout(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: GROQ_VISION_MODEL,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: CONTENT_ANALYSIS_PROMPT },
                            { type: "image_url", image_url: { url: imageUrl } },
                        ],
                    }],
                    temperature: 0.1,
                    max_completion_tokens: 1024,
                }),
            },
            PROVIDER_TIMEOUT_MS
        )

        if (!response.ok) {
            const errorText = await response.text().catch(() => "")
            const resetDuration = response.headers.get("x-ratelimit-reset-requests")
            const fullError = `Groq API error: ${response.status} ${response.statusText} - ${errorText}${resetDuration ? ` x-ratelimit-reset-requests: ${resetDuration}` : ""}`
            if (response.status === 429) {
                await recordProviderRateLimit(env, "groq", fullError)
            }

            return {
                success: false,
                errorMessage: fullError,
                rateLimited: response.status === 429,
                retryable: isRetryableStatus(response.status),
            }
        }

        const data = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>
        }
        const content = data.choices?.[0]?.message?.content
        if (!content) {
            return {
                success: false,
                errorMessage: "No content received from Groq",
                rateLimited: false,
                retryable: false,
            }
        }

        return {
            success: true,
            analysis: {
                ...parseVisionResponse(content),
                provider: "groq",
            },
        }
    } catch (error) {
        return {
            success: false,
            errorMessage: error instanceof Error ? error.message : "Unknown Groq error",
            rateLimited: false,
            retryable: true,
        }
    }
}

async function analyzeWithOpenRouterWorker(env: Env, imageUrl: string): Promise<VisionAttemptResult> {
    if (!env.OPENROUTER_API_KEY) {
        return {
            success: false,
            errorMessage: "OPENROUTER_API_KEY is not configured for the worker",
            rateLimited: false,
            retryable: false,
        }
    }

    try {
        const response = await fetchJsonWithTimeout(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: OPENROUTER_VISION_MODEL,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "image_url", image_url: { url: imageUrl } },
                            { type: "text", text: CONTENT_ANALYSIS_PROMPT },
                        ],
                    }],
                    temperature: 0.1,
                }),
            },
            PROVIDER_TIMEOUT_MS
        )

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "")
            const fullError = `OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`
            if (response.status === 429) {
                await recordProviderRateLimit(env, "openrouter", errorBody || fullError)
            }

            return {
                success: false,
                errorMessage: fullError,
                rateLimited: response.status === 429,
                retryable: isRetryableStatus(response.status),
            }
        }

        const data = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>
        }
        const content = data.choices?.[0]?.message?.content
        if (!content) {
            return {
                success: false,
                errorMessage: "No content received from OpenRouter",
                rateLimited: false,
                retryable: false,
            }
        }

        return {
            success: true,
            analysis: {
                ...parseVisionResponse(content),
                provider: "openrouter",
            },
        }
    } catch (error) {
        return {
            success: false,
            errorMessage: error instanceof Error ? error.message : "Unknown OpenRouter error",
            rateLimited: false,
            retryable: true,
        }
    }
}

async function analyzeImageContentWorker(env: Env, imageUrl: string): Promise<VisionAttemptResult> {
    const failures: VisionProviderFailure[] = []

    const groqResult = await analyzeWithGroqWorker(env, imageUrl)
    if (groqResult.success) {
        return groqResult
    }
    failures.push({
        provider: "groq",
        errorMessage: groqResult.errorMessage,
        rateLimited: groqResult.rateLimited,
        retryable: groqResult.retryable,
    })

    const openRouterResult = await analyzeWithOpenRouterWorker(env, imageUrl)
    if (openRouterResult.success) {
        return openRouterResult
    }
    failures.push({
        provider: "openrouter",
        errorMessage: openRouterResult.errorMessage,
        rateLimited: openRouterResult.rateLimited,
        retryable: openRouterResult.retryable,
    })

    const allRateLimited = failures.length > 0 && failures.every((failure) => failure.rateLimited)
    const anyRetryable = failures.some((failure) => failure.retryable)

    return {
        success: false,
        errorMessage: failures.map((failure) => `${failure.provider}: ${failure.errorMessage}`).join("; "),
        rateLimited: allRateLimited,
        retryable: !allRateLimited && anyRetryable,
    }
}

async function handleSingleGenerationMessage(
    message: Message<GenerationQueueMessage & { jobType: "single_generation" }>,
    env: Env
): Promise<void> {
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

    if (!continuation.canContinue || !continuation.ownerId || !continuation.generationParams) {
        message.ack()
        return
    }

    const params = continuation.generationParams
    const { generationAttempt, seed, dirtberrySourceDimensions } = await executeProviderGeneration(message.body.apiKey, params)

    if (!generationAttempt.success) {
        const canRetry = generationAttempt.retryable && workerAttempt < GENERATION_MAX_ATTEMPTS
        if (canRetry) {
            message.retry({
                delaySeconds: Math.max(1, Math.round(calculateBackoffDelayMs(workerAttempt, 2_000, 30_000) / 1_000)),
            })
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

    if (!postFetchContinuation.canContinue || !postFetchContinuation.ownerId || !postFetchContinuation.generationParams) {
        message.ack()
        return
    }

    const r2Key = await generateR2Key(postFetchContinuation.ownerId, contentType)
    const uploadResult = await uploadToR2(env, r2Key, mediaBytes, contentType)

    const completeResult = await postConvexJsonWithRetry<CompleteGenerationResponse>(env, "/workers/single-generation/complete", {
        generationId: message.body.generationId,
        claimToken,
        r2Key: uploadResult.r2Key,
        url: uploadResult.url,
        width: params.width ?? (isVideoRequest(params) ? 1024 : dirtberrySourceDimensions?.width ?? 1024),
        height: params.height ?? (isVideoRequest(params) ? 1024 : dirtberrySourceDimensions?.height ?? 1024),
        seed,
        contentType,
        sizeBytes: uploadResult.sizeBytes,
        retryCount: workerAttempt > 1 ? workerAttempt - 1 : undefined,
    })

    if (!completeResult.completed && !completeResult.duplicate) {
        await deleteR2Object(env, uploadResult.r2Key)
    }

    message.ack()
}

async function handleBatchItemMessage(
    message: Message<GenerationQueueMessage & { jobType: "batch_item" }>,
    env: Env
): Promise<void> {
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

    if (!continuation.canContinue || !continuation.ownerId || !continuation.generationParams) {
        message.ack()
        return
    }

    const params = continuation.generationParams
    const { generationAttempt, seed, dirtberrySourceDimensions } = await executeProviderGeneration(message.body.apiKey, params)

    if (!generationAttempt.success) {
        const canRetry = generationAttempt.retryable && workerAttempt < GENERATION_MAX_ATTEMPTS
        if (canRetry) {
            message.retry({
                delaySeconds: Math.max(1, Math.round(calculateBackoffDelayMs(workerAttempt, 2_000, 30_000) / 1_000)),
            })
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

    if (!postFetchContinuation.canContinue || !postFetchContinuation.ownerId || !postFetchContinuation.generationParams) {
        message.ack()
        return
    }

    const r2Key = await generateR2Key(postFetchContinuation.ownerId, contentType)
    const uploadResult = await uploadToR2(env, r2Key, mediaBytes, contentType)

    const completeResult = await postConvexJsonWithRetry<CompleteBatchItemResponse>(env, "/workers/batch-item/complete", {
        batchJobId: message.body.batchJobId,
        itemIndex: message.body.itemIndex,
        claimToken,
        r2Key: uploadResult.r2Key,
        url: uploadResult.url,
        width: params.width ?? (isVideoRequest(params) ? 1024 : dirtberrySourceDimensions?.width ?? 1024),
        height: params.height ?? (isVideoRequest(params) ? 1024 : dirtberrySourceDimensions?.height ?? 1024),
        seed,
        contentType,
        sizeBytes: uploadResult.sizeBytes,
        retryCount: workerAttempt > 1 ? workerAttempt - 1 : undefined,
    })

    if (!completeResult.completed && !completeResult.duplicate) {
        await deleteR2Object(env, uploadResult.r2Key)
    }

    message.ack()
}

async function handleSecondaryAssetsMessage(
    message: Message<GenerationQueueMessage & { jobType: "secondary_assets" }>,
    env: Env
): Promise<void> {
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
        const canRetry = normalizedError.retryable && workerAttempt < GENERATION_MAX_ATTEMPTS

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
            message.retry({
                delaySeconds: Math.max(1, Math.round(calculateBackoffDelayMs(workerAttempt, 2_000, 30_000) / 1_000)),
            })
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

async function handlePromptInferenceMessage(
    message: Message<GenerationQueueMessage & { jobType: "prompt_inference" }>,
    env: Env
): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)

    const claimResult = await postConvexJsonWithRetry<ClaimModerationResponse>(env, "/workers/moderation/claim", {
        imageId: message.body.imageId,
        stage: "prompt_inference" satisfies ModerationStage,
        claimToken,
        workerAttempt,
    })

    if (!claimResult.claimed) {
        message.ack()
        return
    }

    const continuation = await postConvexJsonWithRetry<ContinueModerationResponse>(env, "/workers/moderation/continue", {
        imageId: message.body.imageId,
        stage: "prompt_inference",
        claimToken,
    })

    if (!continuation.canContinue || !continuation.prompt) {
        message.ack()
        return
    }

    try {
        const inference = await analyzePromptWithCerebrasWorker(env, continuation.prompt)
        const decision = decidePromptSensitivity(inference)

        await postConvexJsonWithRetry<CompletePromptInferenceResponse>(env, "/workers/moderation/prompt-inference/complete", {
            imageId: message.body.imageId,
            claimToken,
            promptInference: {
                category: inference.category,
                confidence: inference.confidence,
                reasoning: inference.reasoning,
                provider: "cerebras/llama3.1-8b",
                analyzedAt: Date.now(),
            },
            action: decision.action,
        })

        message.ack()
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown prompt inference error"
        const canRetry = workerAttempt < GENERATION_MAX_ATTEMPTS

        if (canRetry) {
            message.retry({
                delaySeconds: Math.max(1, Math.round(calculateBackoffDelayMs(workerAttempt, 2_000, 30_000) / 1_000)),
            })
            return
        }

        await postConvexJsonWithRetry<FailPromptInferenceResponse>(env, "/workers/moderation/prompt-inference/fail", {
            imageId: message.body.imageId,
            claimToken,
            errorMessage,
        })

        message.ack()
    }
}

async function handleVisionAnalysisMessage(
    message: Message<GenerationQueueMessage & { jobType: "vision_analysis" }>,
    env: Env
): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)

    const claimResult = await postConvexJsonWithRetry<ClaimModerationResponse>(env, "/workers/moderation/claim", {
        imageId: message.body.imageId,
        stage: "vision_analysis" satisfies ModerationStage,
        claimToken,
        workerAttempt,
    })

    if (!claimResult.claimed) {
        message.ack()
        return
    }

    const continuation = await postConvexJsonWithRetry<ContinueModerationResponse>(env, "/workers/moderation/continue", {
        imageId: message.body.imageId,
        stage: "vision_analysis",
        claimToken,
    })

    if (!continuation.canContinue || !continuation.imageUrl) {
        message.ack()
        return
    }

    const analysisResult = await analyzeImageContentWorker(env, continuation.imageUrl)

    if (!analysisResult.success) {
        const canRetry = analysisResult.retryable && workerAttempt < GENERATION_MAX_ATTEMPTS
        if (canRetry) {
            message.retry({
                delaySeconds: Math.max(1, Math.round(calculateBackoffDelayMs(workerAttempt, 2_000, 30_000) / 1_000)),
            })
            return
        }

        await postConvexJsonWithRetry<FailVisionAnalysisResponse>(env, "/workers/moderation/vision-analysis/fail", {
            imageId: message.body.imageId,
            claimToken,
            errorMessage: analysisResult.errorMessage,
            rateLimited: analysisResult.rateLimited,
        })

        message.ack()
        return
    }

    const sensitivityScore = calculateSensitivityScore(analysisResult.analysis)
    const isSensitive = sensitivityScore >= 0.8

    await postConvexJsonWithRetry<CompleteVisionAnalysisResponse>(env, "/workers/moderation/vision-analysis/complete", {
        imageId: message.body.imageId,
        claimToken,
        isSensitive,
        confidence: isSensitive ? sensitivityScore * (analysisResult.analysis.confidence || 1) : 0,
        contentAnalysis: {
            nudity: analysisResult.analysis.nudity,
            sexual: analysisResult.analysis.sexual_content,
            violence: analysisResult.analysis.violence,
            analyzedAt: Date.now(),
        },
    })

    message.ack()
}

const worker: ExportedHandler<Env, GenerationQueueMessage> = {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url)

        if (url.pathname === "/health") {
            return json({
                ok: true,
                service: "bloomstudio-worker",
                env: env.APP_ENV,
            })
        }

        if (url.pathname === "/dispatch" && request.method === "POST") {
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

            logWorkerEvent(env, "log", "dispatch.enqueued", {
                jobType: body.jobType,
                jobId: body.jobType === "single_generation"
                    ? body.generationId
                    : body.jobType === "batch_item"
                        ? `${body.batchJobId}:${body.itemIndex}`
                        : body.imageId,
                attempt: body.attempt,
            })

            return json({
                ok: true,
                enqueued: true,
                jobType: body.jobType,
                jobId: body.jobType === "single_generation"
                    ? body.generationId
                    : body.jobType === "batch_item"
                        ? `${body.batchJobId}:${body.itemIndex}`
                        : body.imageId,
            })
        }

        return json({ ok: false, error: "Not found" }, { status: 404 })
    },

    async queue(batch, env): Promise<void> {
        for (const message of batch.messages) {
            try {
                if (message.body.jobType === "single_generation") {
                    await handleSingleGenerationMessage(
                        message as Message<GenerationQueueMessage & { jobType: "single_generation" }>,
                        env
                    )
                    continue
                }

                if (message.body.jobType === "batch_item") {
                    await handleBatchItemMessage(
                        message as Message<GenerationQueueMessage & { jobType: "batch_item" }>,
                        env
                    )
                    continue
                }

                if (message.body.jobType === "secondary_assets") {
                    await handleSecondaryAssetsMessage(
                        message as Message<GenerationQueueMessage & { jobType: "secondary_assets" }>,
                        env
                    )
                    continue
                }

                if (message.body.jobType === "prompt_inference") {
                    await handlePromptInferenceMessage(
                        message as Message<GenerationQueueMessage & { jobType: "prompt_inference" }>,
                        env
                    )
                    continue
                }

                if (message.body.jobType === "vision_analysis") {
                    await handleVisionAnalysisMessage(
                        message as Message<GenerationQueueMessage & { jobType: "vision_analysis" }>,
                        env
                    )
                    continue
                }
            } catch (error) {
                logWorkerEvent(env, "error", "queue.processing_failed", {
                    jobType: message.body.jobType,
                    jobId: getQueueMessageLabel(message.body),
                    attempts: message.attempts,
                    errorMessage: error instanceof Error ? error.message : "Unknown queue processing error",
                })

                if (message.attempts < GENERATION_MAX_ATTEMPTS) {
                    message.retry({
                        delaySeconds: Math.max(1, Math.round(calculateBackoffDelayMs(message.attempts, 2_000, 30_000) / 1_000)),
                    })
                } else {
                    message.ack()
                }
            }
        }
    },
}

export default worker
