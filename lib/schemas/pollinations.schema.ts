import { z } from "zod";

// Quality levels enum
export const QualitySchema = z.enum(["low", "medium", "high", "hd"]);

// Image models from the new API
// We define known models for reference, but allow any string to support dynamic models
export const KnownImageModelSchema = z.enum([
    "flux",
    "zimage",
    "turbo",
    "gptimage",
    "gptimage-large",
    "seedream",
    "kontext",
    "nanobanana",
    "seedream-pro",
    "nanobanana-pro",
]);

export const ImageModelSchema = z.union([KnownImageModelSchema, z.string()]);

// Video models
export const VideoModelSchema = z.enum(["veo", "seedance", "seedance-pro"]);

// Combined model schema
export const GenerationModelSchema = z.union([
    ImageModelSchema,
    VideoModelSchema,
]);

// Aspect ratio for videos
export const VideoAspectRatioSchema = z.enum(["16:9", "9:16"]);

// Image generation parameters matching gen.pollinations.ai API
export const ImageGenerationParamsSchema = z.object({
    prompt: z.string().min(1, { error: "Prompt is required" }),
    negativePrompt: z.string().optional(),
    model: ImageModelSchema.optional().default("flux"),
    width: z.number().int().min(64).max(2048).optional().default(768),
    height: z.number().int().min(64).max(2048).optional().default(768),
    seed: z.number().int().min(0).max(1844674407370955).optional(),
    enhance: z.boolean().optional().default(false),
    quality: QualitySchema.optional().default("medium"),
    // negative_prompt (snake_case) is handled by transformation in the service layer
    // We only expose negativePrompt (camelCase) to the application
    private: z.boolean().optional().default(false),
    nologo: z.boolean().optional().default(false),
    nofeed: z.boolean().optional().default(false),
    safe: z.boolean().optional().default(false),
    transparent: z.boolean().optional().default(false),
    guidance_scale: z.number().min(1).max(20).optional(),
    image: z.string().optional(), // Reference image URL(s)
});

// Video generation extends image with video-specific params
export const VideoGenerationParamsSchema = ImageGenerationParamsSchema.extend({
    model: VideoModelSchema,
    duration: z.number().int().min(2).max(10).optional(),
    aspectRatio: VideoAspectRatioSchema.optional(),
    audio: z.boolean().optional().default(false), // veo only
});

// Generated image result
export const GeneratedImageSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    prompt: z.string(),
    params: ImageGenerationParamsSchema,
    timestamp: z.number(),
    // Storage metadata fields (populated when image is stored in R2)
    r2Key: z.string().optional(),
    sizeBytes: z.number().optional(),
    contentType: z.string().optional(),
    visibility: z.enum(["public", "unlisted"]).optional(),
    // Convex fields
    _id: z.string().optional(),
    _creationTime: z.number().optional(),
});

// Model pricing schema
export const ModelPricingSchema = z.object({
    currency: z.literal("pollen"),
    input_token_price: z.number().optional(),
    output_token_price: z.number().optional(),
    cached_token_price: z.number().optional(),
    image_price: z.number().optional(),
    audio_input_price: z.number().optional(),
    audio_output_price: z.number().optional(),
});

// Image model info from /image/models endpoint
export const ImageModelInfoSchema = z.object({
    name: z.string(),
    aliases: z.array(z.string()),
    pricing: ModelPricingSchema,
    description: z.string().optional(),
    input_modalities: z.array(z.string()).optional(),
    output_modalities: z.array(z.string()).optional(),
    tools: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    context_window: z.number().optional(),
    voices: z.array(z.string()).optional(),
    is_specialized: z.boolean().optional(),
});

// Response array
export const ImageModelsResponseSchema = z.array(ImageModelInfoSchema);

// Validation error details
export const ValidationErrorDetailsSchema = z.looseObject({
    name: z.string(),
    stack: z.string().optional(),
    formErrors: z.array(z.string()),
    fieldErrors: z.record(z.string(), z.array(z.string())),
});

// API error codes - these are the codes returned by the Pollinations API
export const ApiErrorCodeSchema = z.enum([
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "INTERNAL_ERROR",
]);

// Client-side error codes - these are additional codes used by the client
export const ClientErrorCodeSchema = z.enum([
    "GENERATION_FAILED",
    "VALIDATION_ERROR",
    "NETWORK_ERROR",
    "UNKNOWN_ERROR",
]);

// Combined error codes (API + Client)
export const ErrorCodeSchema = z.union([ApiErrorCodeSchema, ClientErrorCodeSchema]);

// Base error schema
const BaseApiErrorSchema = z.looseObject({
    message: z.string(),
    timestamp: z.string(),
    requestId: z.string().optional(),
    cause: z.unknown().optional(),
});

// 400 Bad Request
export const BadRequestErrorSchema = z.looseObject({
    status: z.literal(400),
    success: z.literal(false),
    error: BaseApiErrorSchema.extend({
        code: z.literal("BAD_REQUEST"),
        details: ValidationErrorDetailsSchema.optional(),
    }),
});

// 401 Unauthorized
export const UnauthorizedErrorSchema = z.looseObject({
    status: z.literal(401),
    success: z.literal(false),
    error: BaseApiErrorSchema.extend({
        code: z.literal("UNAUTHORIZED"),
        details: z.looseObject({
            name: z.string().optional(),
            stack: z.string().optional(),
        }).optional(),
    }),
});

// 500 Internal Error
export const InternalErrorSchema = z.looseObject({
    status: z.literal(500),
    success: z.literal(false),
    error: BaseApiErrorSchema.extend({
        code: z.literal("INTERNAL_ERROR"),
        message: z.union([
            z.literal("Oh snap, something went wrong on our end. We're on it!"),
            z.string(),
        ]),
        details: z.looseObject({
            name: z.string().optional(),
            stack: z.string().optional(),
        }).optional(),
    }),
});

// Union of all API errors
export const ApiErrorSchema = z.union([
    BadRequestErrorSchema,
    UnauthorizedErrorSchema,
    InternalErrorSchema,
]);

// Infer TypeScript types from Zod schemas
export type Quality = z.infer<typeof QualitySchema>;
export type KnownImageModel = z.infer<typeof KnownImageModelSchema>;
export type ImageModel = z.infer<typeof ImageModelSchema>;
export type VideoModel = z.infer<typeof VideoModelSchema>;
export type GenerationModel = z.infer<typeof GenerationModelSchema>;
export type VideoAspectRatio = z.infer<typeof VideoAspectRatioSchema>;
export type ResolvedImageGenerationParams = z.infer<typeof ImageGenerationParamsSchema>;
export type ImageGenerationParams = z.input<typeof ImageGenerationParamsSchema>;
export type ResolvedVideoGenerationParams = z.infer<typeof VideoGenerationParamsSchema>;
export type VideoGenerationParams = z.input<typeof VideoGenerationParamsSchema>;
export type GeneratedImage = z.infer<typeof GeneratedImageSchema>;
export type ModelPricing = z.infer<typeof ModelPricingSchema>;
export type ImageModelInfo = z.infer<typeof ImageModelInfoSchema>;
export type ImageModelsResponse = z.infer<typeof ImageModelsResponseSchema>;
export type BadRequestError = z.infer<typeof BadRequestErrorSchema>;
export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;
export type InternalError = z.infer<typeof InternalErrorSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ClientErrorCode = z.infer<typeof ClientErrorCodeSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
