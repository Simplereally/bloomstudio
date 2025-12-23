import { describe, it, expect } from "vitest"
import {
    ImageGenerationParamsSchema,
    ImageModelSchema,
    QualitySchema,
    GeneratedImageSchema,
} from "./pollinations.schema"

describe("pollinations.schema", () => {
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

        it("rejects empty prompt", () => {
            const result = ImageGenerationParamsSchema.safeParse({
                prompt: "",
            })
            expect(result.success).toBe(false)
        })

        it("accepts unknown model (dynamic)", () => {
            // This was a critical recommendation in the analysis
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
            expect(result.width).toBe(1024)
            expect(result.height).toBe(1024)
            expect(result.enhance).toBe(false)
        })

        it("strips snake_case negative_prompt if provided (Zod default behavior is strip)", () => {
            // Using 'unknown' cast to force pass extra property
            const input: any = {
                prompt: "test",
                negative_prompt: "bad things"
            };
            const result = ImageGenerationParamsSchema.parse(input);
            // It should NOT have negative_prompt in the output type unless we explicitly added it to the schema, 
            // which we decided AGAINST in the analysis. 
            // We only support camelCase `negativePrompt` in the internal schema.
            expect((result as any).negative_prompt).toBeUndefined();
        })
    })

    describe("QualitySchema", () => {
        it.each(["low", "medium", "high", "hd"])("accepts '%s'", (quality) => {
            expect(QualitySchema.safeParse(quality).success).toBe(true)
        })

        it("rejects invalid quality", () => {
            expect(QualitySchema.safeParse("ultra").success).toBe(false)
        })
    })
})
