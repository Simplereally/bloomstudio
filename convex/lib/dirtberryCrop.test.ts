import sharp from "sharp"
import { describe, expect, it } from "vitest"
import {
    DIRTBERRY_OUTPUT_HEIGHT,
    DIRTBERRY_SOURCE_HEIGHT,
    DIRTBERRY_SOURCE_WIDTH,
    DIRTBERRY_TRIM_FRACTION,
    calculateDirtberryCropRegion,
    cropDirtberryImageBuffer,
} from "./dirtberryCrop"

describe("calculateDirtberryCropRegion", () => {
    it("calculates 3% top/bottom crop for source height", () => {
        const region = calculateDirtberryCropRegion(DIRTBERRY_SOURCE_HEIGHT)
        expect(region).toEqual({
            top: Math.round(DIRTBERRY_SOURCE_HEIGHT * DIRTBERRY_TRIM_FRACTION),
            height: DIRTBERRY_OUTPUT_HEIGHT,
        })
    })

    it("returns null when crop would be invalid", () => {
        expect(calculateDirtberryCropRegion(0)).toBeNull()
        expect(calculateDirtberryCropRegion(1)).toBeNull()
        expect(calculateDirtberryCropRegion(10)).toBeNull()
    })
})

describe("cropDirtberryImageBuffer", () => {
    it("crops an image buffer to remove top/bottom strips", async () => {
        const input = await sharp({
            create: {
                width: DIRTBERRY_SOURCE_WIDTH,
                height: DIRTBERRY_SOURCE_HEIGHT,
                channels: 3,
                background: { r: 255, g: 0, b: 0 },
            },
        })
            .jpeg()
            .toBuffer()

        const result = await cropDirtberryImageBuffer(input)
        expect(result.wasCropped).toBe(true)
        expect(result.width).toBe(DIRTBERRY_SOURCE_WIDTH)
        expect(result.height).toBe(DIRTBERRY_OUTPUT_HEIGHT)
        expect(result.inputWidth).toBe(DIRTBERRY_SOURCE_WIDTH)
        expect(result.inputHeight).toBe(DIRTBERRY_SOURCE_HEIGHT)
        expect(result.trimPixels).toBe(Math.round(DIRTBERRY_SOURCE_HEIGHT * DIRTBERRY_TRIM_FRACTION))

        const metadata = await sharp(result.buffer).metadata()
        expect(metadata.width).toBe(DIRTBERRY_SOURCE_WIDTH)
        expect(metadata.height).toBe(DIRTBERRY_OUTPUT_HEIGHT)
    })

    it("still crops when upstream returns shorter-than-expected heights", async () => {
        const input = await sharp({
            create: {
                width: DIRTBERRY_SOURCE_WIDTH,
                height: DIRTBERRY_OUTPUT_HEIGHT,
                channels: 3,
                background: { r: 0, g: 255, b: 0 },
            },
        })
            .jpeg()
            .toBuffer()

        const result = await cropDirtberryImageBuffer(input)
        const expectedTrim = Math.round(DIRTBERRY_OUTPUT_HEIGHT * DIRTBERRY_TRIM_FRACTION)
        expect(result.wasCropped).toBe(true)
        expect(result.width).toBe(DIRTBERRY_SOURCE_WIDTH)
        expect(result.height).toBe(DIRTBERRY_OUTPUT_HEIGHT - expectedTrim * 2)
        expect(result.trimPixels).toBe(expectedTrim)
    })
})
