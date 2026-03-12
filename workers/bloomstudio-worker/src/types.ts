export type AppEnv = "development" | "production"
export type ModerationStage = "prompt_inference" | "vision_analysis"
export type ProviderName = "groq" | "openrouter"

export type SingleGenerationDispatchRequestBody = {
    jobType: "single_generation"
    generationId: string
    attempt: number
    enqueuedAt: number
}

export type BatchItemDispatchRequestBody = {
    jobType: "batch_item"
    batchJobId: string
    itemIndex: number
    attempt: number
    enqueuedAt: number
}

export type PromptInferenceDispatchRequestBody = {
    jobType: "prompt_inference"
    imageId: string
    attempt: number
    enqueuedAt: number
}

export type VisionAnalysisDispatchRequestBody = {
    jobType: "vision_analysis"
    imageId: string
    attempt: number
    enqueuedAt: number
}

export type SecondaryAssetsDispatchRequestBody = {
    jobType: "secondary_assets"
    imageId: string
    attempt: number
    enqueuedAt: number
}

export type DispatchRequestBody =
    | SingleGenerationDispatchRequestBody
    | BatchItemDispatchRequestBody
    | PromptInferenceDispatchRequestBody
    | VisionAnalysisDispatchRequestBody
    | SecondaryAssetsDispatchRequestBody

export type GenerationQueueMessage = DispatchRequestBody

export type GenerationParams = {
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

export type PromptInferenceResult = {
    isSensitive: boolean
    category: "explicit" | "suggestive" | "safe"
    confidence: number
    reasoning: string
}

export type DecisionResult = {
    action: "tag_sensitive" | "tag_safe" | "escalate_to_vision"
    inferenceResult: PromptInferenceResult
}

export type VisionContentAnalysisResult = {
    nudity: "none" | "full"
    sexual_content: "none" | "suggestive" | "explicit"
    violence: "none" | "mild" | "graphic"
    confidence: number
    reasoning: string
    provider: ProviderName
}

export type VisionProviderFailure = {
    provider: ProviderName
    errorMessage: string
    rateLimited: boolean
    retryable: boolean
}

export type VisionAttemptResult =
    | { success: true; analysis: VisionContentAnalysisResult }
    | { success: false; errorMessage: string; rateLimited: boolean; retryable: boolean }

export type Env = {
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
