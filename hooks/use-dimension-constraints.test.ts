/**
 * useDimensionConstraints Hook Tests
 *
 * Tests for the dimension constraints hook used in model-aware dimension controls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDimensionConstraints } from "./use-dimension-constraints"

describe("useDimensionConstraints", () => {
    const defaultProps = {
        modelId: "flux",
        width: 1000,
        height: 1000,
        onWidthChange: vi.fn(),
        onHeightChange: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("constraints lookup", () => {
        it("should return Flux constraints for flux models", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "flux" })
            )

            expect(result.current.constraints.maxPixels).toBe(1_048_575)
            expect(result.current.constraints.step).toBe(32)
        })

        it("should return default constraints for non-flux models", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "turbo" })
            )

            expect(result.current.constraints.maxPixels).toBe(Infinity)
            expect(result.current.constraints.step).toBe(64)
        })
    })

    describe("dynamic max dimensions", () => {
        it("should calculate maxWidth based on current height for flux", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, height: 1000 })
            )

            // maxPixels / height = 1,048,575 / 1000 = 1048
            expect(result.current.maxWidth).toBe(1048)
        })

        it("should calculate maxHeight based on current width for flux", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, width: 1000 })
            )

            expect(result.current.maxHeight).toBe(1048)
        })

        it("should return maxDimension for models without pixel limits", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    modelId: "turbo",
                    width: 1024,
                    height: 1024,
                })
            )

            expect(result.current.maxWidth).toBe(2048)
            expect(result.current.maxHeight).toBe(2048)
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

        it("should detect when dimensions are at or over the limit", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1024,
                    height: 1024,
                })
            )

            expect(result.current.isOverLimit).toBe(true)
        })

        it("should calculate percentage of limit for flux models", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    width: 1000,
                    height: 1000,
                })
            )

            // 1,000,000 / 1,048,575 * 100 ≈ 95.4%
            expect(result.current.percentOfLimit).toBeCloseTo(95.4, 0)
        })

        it("should return null percentage for models without limits", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({
                    ...defaultProps,
                    modelId: "turbo",
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
        it("should be true for flux models", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "flux" })
            )

            expect(result.current.hasPixelLimit).toBe(true)
        })

        it("should be false for models without limits", () => {
            const { result } = renderHook(() =>
                useDimensionConstraints({ ...defaultProps, modelId: "turbo" })
            )

            expect(result.current.hasPixelLimit).toBe(false)
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

            // maxWidth = floor(1048575 / 1000) = 1048, which is not aligned to 32
            // So it gets clamped to 1048 (the maxWidth limit takes precedence)
            expect(onWidthChange).toHaveBeenCalledWith(1048)
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

            // Width should be clamped to maxWidth (1048 for height=1000)
            expect(onWidthChange).toHaveBeenCalledWith(1048)
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

            // Height should be clamped to maxHeight (1048 for width=1000)
            expect(onHeightChange).toHaveBeenCalledWith(1048)
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
                { initialProps: { modelId: "flux" } }
            )

            expect(result.current.constraints.maxPixels).toBe(1_048_575)

            rerender({ modelId: "turbo" })

            expect(result.current.constraints.maxPixels).toBe(Infinity)
        })
    })
})
