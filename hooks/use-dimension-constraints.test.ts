/**
 * useDimensionConstraints Hook Tests
 *
 * Tests for the dimension constraints hook used in model-aware dimension controls.
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useDimensionConstraints } from "./use-dimension-constraints"

describe("useDimensionConstraints", () => {
    const defaultProps = {
        modelId: "kontext",
        width: 1000,
        height: 1000,
        onWidthChange: vi.fn(),
        onHeightChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("constraints lookup", () => {
        it("should return Kontext constraints for kontext model", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "kontext" })
            )

            expect(result.current.constraints.maxPixels).toBe(1_048_576)
            expect(result.current.constraints.step).toBe(32)
        })

        it("should return SDXL Turbo constraints for turbo model (strict 768px limit)", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "turbo" })
            )

            expect(result.current.constraints.maxPixels).toBe(589_825)
            expect(result.current.constraints.maxDimension).toBe(768)
            expect(result.current.constraints.step).toBe(64)
        })

        it("should return default constraints for unknown models", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "some-unknown-model" })
            )

            expect(result.current.constraints.maxPixels).toBe(Infinity)
            expect(result.current.constraints.step).toBe(64)
        })
    })

    describe("dynamic max dimensions", () => {
        it("should calculate maxWidth based on current height for kontext", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, height: 1000 })
            )

            // maxPixels / height = 1,048,576 / 1000 = 1048, aligned to step 32 = 1024
            expect(result.current.maxWidth).toBe(1024)
        })

        it("should calculate maxHeight based on current width for kontext", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, width: 1000 })
            )

            // maxPixels / width = 1,048,576 / 1000 = 1048, aligned to step 32 = 1024
            expect(result.current.maxHeight).toBe(1024)
        })

        it("should return maxDimension for models without pixel limits", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    modelId: "some-unknown-model",
                    width: 1024,
                    height: 1024,
                })
            )

            expect(result.current.maxWidth).toBe(2048)
            expect(result.current.maxHeight).toBe(2048)
        })

        it("should return 768 maxDimension for turbo model", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    modelId: "turbo",
                    width: 512,
                    height: 512,
                })
            )

            // SDXL Turbo has strict 768px max dimension
            expect(result.current.maxWidth).toBe(768)
            expect(result.current.maxHeight).toBe(768)
        })
    })

    describe("pixel count and limit detection", () => {
        it("should calculate current pixel count", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1000,
                    height: 1000,
                })
            )

            expect(result.current.pixelCount).toBe(1_000_000)
        })

        it("should detect when dimensions are under the limit", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1000,
                    height: 1000,
                })
            )

            expect(result.current.isOverLimit).toBe(false)
        })

        it("should detect when dimensions are over the limit", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1025,
                    height: 1024,
                })
            )

            expect(result.current.isOverLimit).toBe(true)
        })

        it("should calculate percentage of limit for kontext model", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1000,
                    height: 1000,
                })
            )

            // 1,000,000 / 1,048,576 * 100 ≈ 95.4%
            expect(result.current.percentOfLimit).toBeCloseTo(95.4, 0)
        })

        it("should return null percentage for models without limits", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    modelId: "some-unknown-model",
                })
            )

            expect(result.current.percentOfLimit).toBeNull()
        })
    })

    describe("isEnabled", () => {
        it("should reflect whether dimensions are enabled for the model", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps })
            )

            expect(result.current.isEnabled).toBe(true)
        })
    })

    describe("hasPixelLimit", () => {
        it("should be true for kontext model", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "kontext" })
            )

            expect(result.current.hasPixelLimit).toBe(true)
        })

        it("should be false for models without limits", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "some-unknown-model" })
            )

            expect(result.current.hasPixelLimit).toBe(false)
        })

        it("should be true for turbo model (has 589,824 pixel limit)", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "turbo" })
            )

            expect(result.current.hasPixelLimit).toBe(true)
        })
    })

    describe("handleWidthChange", () => {
        it("should call onWidthChange with aligned value", () => {
            const onWidthChange = vi.fn()
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    onWidthChange,
                    height: 500,
                })
            )

            act(() => {
                result.current.handleWidthChange(1000)
            })

            // 1000 rounded to 32: 992
            expect(onWidthChange).toHaveBeenCalledWith(992)
        })

        it("should clamp width to maxWidth", () => {
            const onWidthChange = vi.fn()
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    onWidthChange,
                    height: 1000,
                })
            )

            act(() => {
                result.current.handleWidthChange(2000) // Over max
            })

            // maxWidth = floor(floor(1048576 / 1000) / 32) * 32 = 1024
            // The value is clamped to the step-aligned maxWidth
            expect(onWidthChange).toHaveBeenCalledWith(1024)
        })

        it("should not exceed pixel limit even with extreme width values", () => {
            const onWidthChange = vi.fn()
            const onHeightChange = vi.fn()

            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1000,
                    height: 1000, // Under 1MP limit
                    onWidthChange,
                    onHeightChange,
                })
            )

            // Even requesting a very large width should be clamped appropriately
            act(() => {
                result.current.handleWidthChange(5000)
            })

            // Width should be clamped to step-aligned maxWidth (1024 for height=1000, step=32)
            expect(onWidthChange).toHaveBeenCalledWith(1024)
        })
    })

    describe("handleHeightChange", () => {
        it("should call onHeightChange with aligned value", () => {
            const onHeightChange = vi.fn()
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    onHeightChange,
                    width: 500,
                })
            )

            act(() => {
                result.current.handleHeightChange(1000)
            })

            expect(onHeightChange).toHaveBeenCalledWith(992)
        })

        it("should not exceed pixel limit even with extreme height values", () => {
            const onWidthChange = vi.fn()
            const onHeightChange = vi.fn()

            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1000,
                    height: 1000, // Under 1MP limit
                    onWidthChange,
                    onHeightChange,
                })
            )

            // Even requesting a very large height should be clamped appropriately
            act(() => {
                result.current.handleHeightChange(5000)
            })

            // Height should be clamped to step-aligned maxHeight (1024 for width=1000, step=32)
            expect(onHeightChange).toHaveBeenCalledWith(1024)
        })
    })

    describe("model change reactivity", () => {
        it("should update constraints when modelId changes", () => {
            const { result, rerender } = renderHook(
                ({ modelId }) =>
                    useDimensionConstraints({
                        ...defaultProps,
                        modelId,
                    }),
                { initialProps: { modelId: "kontext" } }
            )

            expect(result.current.constraints.maxPixels).toBe(1_048_576)

            rerender({ modelId: "some-unknown-model" })

            expect(result.current.constraints.maxPixels).toBe(Infinity)
        })

        it("should update constraints when switching to turbo", () => {
            const { result, rerender } = renderHook(
                ({ modelId }) =>
                    useDimensionConstraints({
                        ...defaultProps,
                        modelId,
                    }),
                { initialProps: { modelId: "kontext" } }
            )

            expect(result.current.constraints.maxPixels).toBe(1_048_576)
            expect(result.current.constraints.maxDimension).toBe(2048)

            rerender({ modelId: "turbo" })

            expect(result.current.constraints.maxPixels).toBe(589_825)
            expect(result.current.constraints.maxDimension).toBe(768)
        })
    })
})
