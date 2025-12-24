import { describe, it, expect } from "vitest"
import { z } from "zod"
import {
    QualitySchema,
    KnownImageModelSchema,
    ImageModelSchema,
    VideoModelSchema,
    GenerationModelSchema,
    VideoAspectRatioSchema,
    ImageGenerationParamsSchema,
    VideoGenerationParamsSchema,
    GeneratedImageSchema,
    ModelPricingSchema,
    ImageModelInfoSchema,
    ImageModelsResponseSchema,
    ValidationErrorDetailsSchema,
    BadRequestErrorSchema,
    UnauthorizedErrorSchema,
    InternalErrorSchema,
    ApiErrorSchema,
    ApiErrorCodeSchema,
    ClientErrorCodeSchema,
    ErrorCodeSchema,
} from "./pollinations.schema"

describe("pollinations.schema", () => {
    describe("QualitySchema", () => {
        it.each(["low", "medium", "high", "hd"])("accepts '%s'", (quality) => {
            expect(QualitySchema.safeParse(quality).success).toBe(true)
            expect(QualitySchema.parse(quality)).toBe(quality)
        })

        it("rejects invalid quality values", () => {
            expect(QualitySchema.safeParse("ultra").success).toBe(false)
            expect(() => QualitySchema.parse("")).toThrow()
            expect(() => QualitySchema.parse(123)).toThrow()
        })
    })

    describe("ImageModelSchema", () => {
        it("accepts known image models", () => {
            expect(KnownImageModelSchema.parse("flux")).toBe("flux")
            expect(KnownImageModelSchema.parse("turbo")).toBe("turbo")
            expect(KnownImageModelSchema.parse("gptimage")).toBe("gptimage")
        })

        it("accepts any string as image model (dynamic models)", () => {
            expect(ImageModelSchema.parse("custom-model")).toBe("custom-model")
            expect(ImageModelSchema.parse("flux")).toBe("flux")
            expect(ImageModelSchema.parse("new-experimental-model")).toBe("new-experimental-model")
        })
    })

    describe("VideoModelSchema", () => {
        it("accepts valid video models", () => {
            expect(VideoModelSchema.parse("veo")).toBe("veo")
            expect(VideoModelSchema.parse("seedance")).toBe("seedance")
            expect(VideoModelSchema.parse("seedance-pro")).toBe("seedance-pro")
        })

        it("rejects invalid video models", () => {
            expect(() => VideoModelSchema.parse("flux")).toThrow()
            expect(() => VideoModelSchema.parse("invalid")).toThrow()
        })
    })

    describe("VideoAspectRatioSchema", () => {
        it("accepts valid aspect ratios", () => {
            expect(VideoAspectRatioSchema.parse("16:9")).toBe("16:9")
            expect(VideoAspectRatioSchema.parse("9:16")).toBe("9:16")
        })

        it("rejects invalid aspect ratios", () => {
            expect(() => VideoAspectRatioSchema.parse("4:3")).toThrow()
            expect(() => VideoAspectRatioSchema.parse("1:1")).toThrow()
        })
    })

    describe("GenerationModelSchema", () => {
        it("accepts both image and video models", () => {
            expect(GenerationModelSchema.parse("flux")).toBe("flux")
            expect(GenerationModelSchema.parse("veo")).toBe("veo")
            expect(GenerationModelSchema.parse("custom-image-model")).toBe("custom-image-model")
        })
    })

    describe("ImageGenerationParamsSchema", () => {
        it("validates valid params", () => {
            const result = ImageGenerationParamsSchema.safeParse({
                prompt: "A beautiful sunset",
                model: "flux",
                width: 1024,
                height: 1024,
            })
            expect(result.success).toBe(true)
        })

        it("validates minimal params with defaults", () => {
            const result = ImageGenerationParamsSchema.parse({
                prompt: "A beautiful sunset",
            })

            expect(result).toMatchObject({
                prompt: "A beautiful sunset",
                model: "flux",
                width: 768,
                height: 768,
                enhance: false,
                quality: "medium",
                private: false,
                nologo: false,
                nofeed: false,
                safe: false,
                transparent: false,
            })
        })

        it("validates full params", () => {
            const params = {
                prompt: "A beautiful sunset",
                negativePrompt: "blurry, low quality",
                model: "turbo",
                width: 512,
                height: 768,
                seed: 12345,
                enhance: true,
                quality: "hd" as const,
                private: true,
                nologo: true,
                nofeed: true,
                safe: true,
                transparent: true,
                guidance_scale: 7.5,
                image: "https://example.com/ref.png",
            }

            const result = ImageGenerationParamsSchema.parse(params)
            expect(result).toMatchObject(params)
        })

        it("rejects empty prompt", () => {
            const result = ImageGenerationParamsSchema.safeParse({
                prompt: "",
            })
            expect(result.success).toBe(false)
        })

        it("accepts unknown model (dynamic)", () => {
            const result = ImageGenerationParamsSchema.safeParse({
                prompt: "test",
                model: "new-experimental-model",
            })
            expect(result.success).toBe(true)
        })

        it("applies defaults correctly", () => {
            const result = ImageGenerationParamsSchema.parse({
                prompt: "test",
            })
            expect(result.model).toBe("flux")
            expect(result.width).toBe(768)
            expect(result.height).toBe(768)
            expect(result.enhance).toBe(false)
        })

        it("strips snake_case negative_prompt if provided (Zod default behavior is strip)", () => {
            const input: unknown = {
                prompt: "test",
                negative_prompt: "bad things"
            };
            const result = ImageGenerationParamsSchema.parse(input);
            expect((result as Record<string, unknown>).negative_prompt).toBeUndefined();
        })

        it("rejects invalid dimensions", () => {
            expect(() =>
                ImageGenerationParamsSchema.parse({
                    prompt: "test",
                    width: 50, // Below min of 64
                })
            ).toThrow()

            expect(() =>
                ImageGenerationParamsSchema.parse({
                    prompt: "test",
                    height: 3000, // Above max of 2048
                })
            ).toThrow()
        })

        it("rejects invalid seed", () => {
            expect(() =>
                ImageGenerationParamsSchema.parse({
                    prompt: "test",
                    seed: -1,
                })
            ).toThrow()

            expect(() =>
                ImageGenerationParamsSchema.parse({
                    prompt: "test",
                    seed: 1844674407370955 + 1,
                })
            ).toThrow()
        })

        it("accepts max valid seed", () => {
            const result = ImageGenerationParamsSchema.safeParse({
                prompt: "test",
                seed: 1844674407370955,
            })
            expect(result.success).toBe(true)
        })

        it("rejects invalid guidance_scale", () => {
            expect(() =>
                ImageGenerationParamsSchema.parse({
                    prompt: "test",
                    guidance_scale: 0, // Below min of 1
                })
            ).toThrow()

            expect(() =>
                ImageGenerationParamsSchema.parse({
                    prompt: "test",
                    guidance_scale: 25, // Above max of 20
                })
            ).toThrow()
        })
    })

    describe("VideoGenerationParamsSchema", () => {
        it("validates video params with video-specific options", () => {
            const result = VideoGenerationParamsSchema.parse({
                prompt: "A flying bird",
                model: "veo",
                duration: 5,
                aspectRatio: "16:9",
                audio: true,
            })

            expect(result.duration).toBe(5)
            expect(result.aspectRatio).toBe("16:9")
            expect(result.audio).toBe(true)
        })

        it("requires video model", () => {
            expect(() =>
                VideoGenerationParamsSchema.parse({
                    prompt: "A flying bird",
                    model: "flux", // Not a video model
                })
            ).toThrow()
        })

        it("validates duration range", () => {
            expect(() =>
                VideoGenerationParamsSchema.parse({
                    prompt: "test",
                    model: "veo",
                    duration: 1, // Below min of 2
                })
            ).toThrow()

            expect(() =>
                VideoGenerationParamsSchema.parse({
                    prompt: "test",
                    model: "veo",
                    duration: 15, // Above max of 10
                })
            ).toThrow()
        })
    })

    describe("GeneratedImageSchema", () => {
        it("validates a generated image", () => {
            const image = {
                id: "img_123",
                url: "https://gen.pollinations.ai/image/test",
                prompt: "A beautiful sunset",
                params: {
                    prompt: "A beautiful sunset",
                    model: "flux",
                    width: 1024,
                    height: 1024,
                    enhance: false,
                    quality: "medium" as const,
                    private: false,
                    nologo: false,
                    nofeed: false,
                    safe: false,
                    transparent: false,
                },
                timestamp: Date.now(),
            }

            const result = GeneratedImageSchema.parse(image)
            expect(result.id).toBe("img_123")
            expect(result.url).toBe("https://gen.pollinations.ai/image/test")
        })

        it("rejects invalid URL", () => {
            expect(() =>
                GeneratedImageSchema.parse({
                    id: "img_123",
                    url: "not-a-url",
                    prompt: "test",
                    params: { prompt: "test" },
                    timestamp: Date.now(),
                })
            ).toThrow()
        })
    })

    describe("ModelPricingSchema", () => {
        it("validates model pricing", () => {
            const pricing = {
                currency: "pollen" as const,
                image_price: 10,
                input_token_price: 0.001,
            }

            const result = ModelPricingSchema.parse(pricing)
            expect(result.currency).toBe("pollen")
            expect(result.image_price).toBe(10)
        })
    })

    describe("ImageModelInfoSchema", () => {
        it("validates image model info", () => {
            const modelInfo = {
                name: "flux",
                aliases: ["flux-schnell"],
                pricing: {
                    currency: "pollen" as const,
                    image_price: 10,
                },
                description: "Fast image generation model",
            }

            const result = ImageModelInfoSchema.parse(modelInfo)
            expect(result.name).toBe("flux")
            expect(result.aliases).toContain("flux-schnell")
        })
    })

    describe("ImageModelsResponseSchema", () => {
        it("validates an array of model info", () => {
            const models = [
                {
                    name: "flux",
                    aliases: [],
                    pricing: { currency: "pollen" as const, image_price: 1 },
                },
                {
                    name: "turbo",
                    aliases: [],
                    pricing: { currency: "pollen" as const, image_price: 1 },
                }
            ]
            const result = ImageModelsResponseSchema.parse(models)
            expect(result).toHaveLength(2)
            expect(result[0].name).toBe("flux")
        })
    })

    describe("Error Schemas", () => {
        describe("ValidationErrorDetailsSchema", () => {
            it("validates validation error details", () => {
                const details = {
                    name: "ZodError",
                    formErrors: ["Invalid request"],
                    fieldErrors: {
                        prompt: ["Prompt is required"],
                        width: ["Width must be at least 64"],
                    },
                }

                const result = ValidationErrorDetailsSchema.parse(details)
                expect(result.fieldErrors.prompt).toContain("Prompt is required")
            })
        })

        describe("BadRequestErrorSchema", () => {
            it("validates 400 error response", () => {
                const error = {
                    status: 400,
                    success: false,
                    error: {
                        code: "BAD_REQUEST",
                        message: "Validation failed",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "ZodError",
                            formErrors: [],
                            fieldErrors: {
                                prompt: ["Prompt is required"],
                            },
                        },
                    },
                }

                const result = BadRequestErrorSchema.parse(error)
                expect(result.status).toBe(400)
                expect(result.error.code).toBe("BAD_REQUEST")
            })
        })

        describe("UnauthorizedErrorSchema", () => {
            it("validates 401 error response", () => {
                const error = {
                    status: 401,
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Invalid API key",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "AuthError",
                        },
                    },
                }

                const result = UnauthorizedErrorSchema.parse(error)
                expect(result.status).toBe(401)
                expect(result.error.code).toBe("UNAUTHORIZED")
            })
        })

        describe("InternalErrorSchema", () => {
            it("validates 500 error response", () => {
                const error = {
                    status: 500,
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Internal server error",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "InternalError",
                        },
                    },
                }

                const result = InternalErrorSchema.parse(error)
                expect(result.status).toBe(500)
                expect(result.error.code).toBe("INTERNAL_ERROR")
            })
        })

        describe("ApiErrorSchema", () => {
            it("validates any API error type", () => {
                const badRequest = {
                    status: 400,
                    success: false,
                    error: {
                        code: "BAD_REQUEST",
                        message: "Bad request",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "ValidationError",
                            formErrors: [],
                            fieldErrors: {},
                        },
                    },
                }

                const unauthorized = {
                    status: 401,
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Unauthorized",
                        timestamp: new Date().toISOString(),
                        details: {
                            name: "AuthError",
                        },
                    },
                }

                expect(ApiErrorSchema.parse(badRequest).status).toBe(400)
                expect(ApiErrorSchema.parse(unauthorized).status).toBe(401)
            })
        })
    })

    describe("Error Code Schemas", () => {
        it("validates API error codes", () => {
            expect(ApiErrorCodeSchema.parse("BAD_REQUEST")).toBe("BAD_REQUEST")
            expect(ApiErrorCodeSchema.parse("UNAUTHORIZED")).toBe("UNAUTHORIZED")
            expect(() => ApiErrorCodeSchema.parse("INVALID")).toThrow()
        })

        it("validates client error codes", () => {
            expect(ClientErrorCodeSchema.parse("NETWORK_ERROR")).toBe("NETWORK_ERROR")
            expect(ClientErrorCodeSchema.parse("VALIDATION_ERROR")).toBe("VALIDATION_ERROR")
            expect(() => ClientErrorCodeSchema.parse("BAD_REQUEST")).toThrow()
        })

        it("validates combined error codes", () => {
            expect(ErrorCodeSchema.parse("BAD_REQUEST")).toBe("BAD_REQUEST")
            expect(ErrorCodeSchema.parse("NETWORK_ERROR")).toBe("NETWORK_ERROR")
        })
    })

    describe("Type inference", () => {
        it("infers correct types from schemas", () => {
            // This test ensures TypeScript types are correctly inferred
            type ImageParams = z.infer<typeof ImageGenerationParamsSchema>
            type InputParams = z.input<typeof ImageGenerationParamsSchema>

            // Runtime check that input type allows optional fields
            const input: InputParams = { prompt: "test" }
            expect(input.prompt).toBe("test")

            // Output type has all defaults filled in
            const output: ImageParams = ImageGenerationParamsSchema.parse(input)
            expect(output.model).toBe("flux")
            expect(output.width).toBe(768)
        })
    })
})
