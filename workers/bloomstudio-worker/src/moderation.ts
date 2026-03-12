import {
    calculateWorkerQueueRetryDelaySeconds,
    WORKER_RETRY_MAX_ATTEMPTS,
} from "../../../lib/cloudflare-worker/retry"
import { postConvexJsonWithRetry } from "./core"
import type {
    DecisionResult,
    Env,
    GenerationQueueMessage,
    ModerationStage,
    PromptInferenceResult,
    ProviderName,
    QueueMessage,
    VisionAttemptResult,
    VisionContentAnalysisResult,
    VisionProviderFailure,
} from "./types"

const PROVIDER_TIMEOUT_MS = 30_000
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

type PromptInferenceMessage = QueueMessage<Extract<GenerationQueueMessage, { jobType: "prompt_inference" }>>
type VisionAnalysisMessage = QueueMessage<Extract<GenerationQueueMessage, { jobType: "vision_analysis" }>>

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
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

function getObjectProperty(value: unknown, key: string): unknown {
    if (!value || typeof value !== "object") {
        return undefined
    }

    return Reflect.get(value, key)
}

function getFirstMessageContent(value: unknown): string | undefined {
    const choices = getObjectProperty(value, "choices")
    if (!Array.isArray(choices) || choices.length === 0) {
        return undefined
    }

    const firstChoice = choices[0]
    const message = getObjectProperty(firstChoice, "message")
    const content = getObjectProperty(message, "content")
    return typeof content === "string" ? content : undefined
}

function isPromptCategory(value: unknown): value is PromptInferenceResult["category"] {
    return value === "explicit" || value === "suggestive" || value === "safe"
}

function parsePromptInferenceResult(rawText: string): PromptInferenceResult {
    let cleanText = rawText.trim()
    if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "")
    } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```/, "").replace(/```$/, "")
    }

    cleanText = cleanText.trim()

    const parsed: unknown = JSON.parse(cleanText)
    const isSensitive = getObjectProperty(parsed, "isSensitive")
    if (typeof isSensitive !== "boolean") {
        throw new Error("Missing or invalid 'isSensitive'")
    }

    const confidence = getObjectProperty(parsed, "confidence")
    if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
        throw new Error("Missing or invalid 'confidence'")
    }

    const reasoning = getObjectProperty(parsed, "reasoning")
    if (typeof reasoning !== "string") {
        throw new Error("Missing or invalid 'reasoning'")
    }

    const category = getObjectProperty(parsed, "category")
    if (!isPromptCategory(category)) {
        throw new Error("Invalid 'category'")
    }

    return {
        isSensitive,
        category,
        confidence,
        reasoning,
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

    const responsePayload: unknown = await response.json()
    const content = getFirstMessageContent(responsePayload)
    if (!content) {
        throw new Error("Empty response from Cerebras")
    }

    return parsePromptInferenceResult(content)
}

function normalizeLevel<T extends string>(value: unknown, allowed: T[]): T {
    if (typeof value === "string") {
        const normalized = value.toLowerCase()
        for (const candidate of allowed) {
            if (normalized === candidate) {
                return candidate
            }
        }
    }

    return allowed[0]
}

function parseVisionResponse(text: string): Omit<VisionContentAnalysisResult, "provider"> {
    let jsonContent = text.trim()
    jsonContent = jsonContent.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim()
    const parsed: unknown = JSON.parse(jsonContent)
    const nudity = getObjectProperty(parsed, "nudity")
    const rawNudity = typeof nudity === "string" ? nudity.toLowerCase() : "none"
    const confidence = getObjectProperty(parsed, "confidence")
    const reasoning = getObjectProperty(parsed, "reasoning")

    return {
        nudity: rawNudity === "full" ? "full" : "none",
        sexual_content: normalizeLevel(getObjectProperty(parsed, "sexual_content"), ["none", "suggestive", "explicit"]),
        violence: normalizeLevel(getObjectProperty(parsed, "violence"), ["none", "mild", "graphic"]),
        confidence: typeof confidence === "number" ? Math.min(1, Math.max(0, confidence)) : 0.5,
        reasoning: typeof reasoning === "string" ? reasoning : "No reasoning provided",
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

        const responsePayload: unknown = await response.json()
        const content = getFirstMessageContent(responsePayload)
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

        const responsePayload: unknown = await response.json()
        const content = getFirstMessageContent(responsePayload)
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

function retryMessage(message: PromptInferenceMessage | VisionAnalysisMessage, attempt: number): void {
    message.retry({
        delaySeconds: calculateWorkerQueueRetryDelaySeconds(attempt),
    })
}

async function claimModerationJob(
    env: Env,
    imageId: string,
    stage: ModerationStage,
    claimToken: string,
    workerAttempt: number
): Promise<boolean> {
    const claimResult = await postConvexJsonWithRetry<ClaimModerationResponse>(env, "/workers/moderation/claim", {
        imageId,
        stage,
        claimToken,
        workerAttempt,
    })

    return claimResult.claimed
}

async function continueModerationJob(
    env: Env,
    imageId: string,
    stage: ModerationStage,
    claimToken: string
): Promise<ContinueModerationResponse> {
    return postConvexJsonWithRetry<ContinueModerationResponse>(env, "/workers/moderation/continue", {
        imageId,
        stage,
        claimToken,
    })
}

export async function handlePromptInferenceMessage(message: PromptInferenceMessage, env: Env): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)

    const claimed = await claimModerationJob(env, message.body.imageId, "prompt_inference", claimToken, workerAttempt)
    if (!claimed) {
        message.ack()
        return
    }

    const continuation = await continueModerationJob(env, message.body.imageId, "prompt_inference", claimToken)
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
        const canRetry = workerAttempt < WORKER_RETRY_MAX_ATTEMPTS

        if (canRetry) {
            retryMessage(message, workerAttempt)
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

export async function handleVisionAnalysisMessage(message: VisionAnalysisMessage, env: Env): Promise<void> {
    const claimToken = crypto.randomUUID()
    const workerAttempt = Math.max(1, message.attempts)

    const claimed = await claimModerationJob(env, message.body.imageId, "vision_analysis", claimToken, workerAttempt)
    if (!claimed) {
        message.ack()
        return
    }

    const continuation = await continueModerationJob(env, message.body.imageId, "vision_analysis", claimToken)
    if (!continuation.canContinue || !continuation.imageUrl) {
        message.ack()
        return
    }

    const analysisResult = await analyzeImageContentWorker(env, continuation.imageUrl)
    if (!analysisResult.success) {
        const canRetry = analysisResult.retryable && workerAttempt < WORKER_RETRY_MAX_ATTEMPTS
        if (canRetry) {
            retryMessage(message, workerAttempt)
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
