/**
 * Aspect Ratio Presets
 *
 * Predefined aspect ratio configurations for each model type.
 * These are internal to the model configuration system.
 */

import type { AspectRatioOption } from "@/types/pollinations";
import { STANDARD_RESOLUTIONS } from "./standard-resolutions";
import { withAspectRatioTags } from "./model-types";

// ============================================================================
// Aspect Ratio Presets
// ============================================================================

/**
 * Flux Schnell aspect ratios - Optimized for 768px max dimension
 *
 * Pollinations enforces:
 * - max 589,824 pixels (768×768 cap)
 * - width/height must be multiples of 8
 * - (width × height) must be divisible by 65,536
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 768   | 768    | 589,824   |
 * | 16:9  | 768   | 432    | 331,776   |
 * | 9:16  | 432   | 768    | 331,776   |
 * | 4:3   | 768   | 576    | 442,368   |
 * | 3:4   | 576   | 768    | 442,368   |
 * | 3:2   | 768   | 512    | 393,216   |
 * | 2:3   | 512   | 768    | 393,216   |
 * | 21:9  | 768   | 328    | 251,904   |
 * | 9:21  | 328   | 768    | 251,904   |
 */
export const FLUX_SCHNELL_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 576, height: 768, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 768, height: 512, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 512, height: 768, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 768, height: 328, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 328, height: 768, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** Standard aspect ratios for ~1MP models (NanoBanana, Kontext) - Optimized for <1MP limit */
export const STANDARD_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1360, height: 768, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 768, height: 1360, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1152, height: 864, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 864, height: 1152, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 896, height: 1120, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1120, height: 896, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 1536, height: 640, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 640, height: 1536, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** SDXL Turbo-optimized aspect ratios (768px max dimension) */
export const SDXLTURBO_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 576, height: 768, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 768, height: 320, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** GPT 1.0 fixed aspect ratios (no custom allowed) */
export const GPTIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1536, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1536, icon: "rectangle-vertical", category: "portrait" },
  ] as const
).map(withAspectRatioTags);

/** GPT 1.5 fixed aspect ratios (no custom allowed) */
export const GPTIMAGE_LARGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1792, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1792, icon: "rectangle-vertical", category: "portrait" },
  ] as const
).map(withAspectRatioTags);

/**
 * Z-Image Turbo aspect ratios - Uses HD standard dimensions within SPAN upscaler limit
 *
 * Pollinations enforces a max of 2,359,296 pixels (768×768 base × 2 upscale = 1536×1536 max square).
 * Uses HD standard resolutions where possible, with ultrawide ratios optimized for pixel budget.
 * All dimensions are aligned to step=8.
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 1536  | 1536   | 2,359,296 | (max MP cap)
 * | 16:9  | 1920  | 1080   | 2,073,600 | (HD standard)
 * | 9:16  | 1080  | 1920   | 2,073,600 | (HD standard)
 * | 4:3   | 1440  | 1080   | 1,555,200 | (HD standard)
 * | 3:4   | 1080  | 1440   | 1,555,200 | (HD standard)
 * | 3:2   | 1624  | 1080   | 1,753,920 | (step=8 aligned)
 * | 2:3   | 1080  | 1624   | 1,753,920 | (step=8 aligned)
 * | 4:5   | 1080  | 1352   | 1,460,160 | (step=8 aligned)
 * | 5:4   | 1352  | 1080   | 1,460,160 | (step=8 aligned)
 * | 21:9  | 2240  | 960    | 2,150,400 | (optimized for pixel budget)
 * | 9:21  | 960   | 2240   | 2,150,400 | (optimized for pixel budget)
 */
export const ZIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1536, height: 1536, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1920, height: 1080, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1080, height: 1920, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1440, height: 1080, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1080, height: 1440, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1624, height: 1080, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 1080, height: 1624, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 1080, height: 1352, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1352, height: 1080, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 2240, height: 960, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 960, height: 2240, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1536, height: 1536, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** Seedream aspect ratios (defaults to 4K Tier) */
export const SEEDREAM_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { ...STANDARD_RESOLUTIONS["4k"]["1:1"], label: "Square", value: "1:1", icon: "square", category: "square" },
    { ...STANDARD_RESOLUTIONS["4k"]["16:9"], label: "Landscape", value: "16:9", icon: "rectangle-horizontal", category: "landscape" },
    { ...STANDARD_RESOLUTIONS["4k"]["9:16"], label: "Portrait", value: "9:16", icon: "rectangle-vertical", category: "portrait" },
    { ...STANDARD_RESOLUTIONS["4k"]["4:3"], label: "Photo", value: "4:3", icon: "image", category: "landscape" },
    { ...STANDARD_RESOLUTIONS["4k"]["3:4"], label: "Portrait Photo", value: "3:4", icon: "frame", category: "portrait" },
    { ...STANDARD_RESOLUTIONS["4k"]["3:2"], label: "Photo Wide", value: "3:2", icon: "image", category: "landscape" },
    { ...STANDARD_RESOLUTIONS["4k"]["2:3"], label: "Photo Tall", value: "2:3", icon: "frame", category: "portrait" },
    { ...STANDARD_RESOLUTIONS["4k"]["21:9"], label: "Ultrawide", value: "21:9", icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** Video aspect ratios (16:9 and 9:16 only) - defaults to HD */
export const VIDEO_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { ...STANDARD_RESOLUTIONS.hd["16:9"], label: "Landscape", value: "16:9", icon: "rectangle-horizontal", category: "landscape" },
    { ...STANDARD_RESOLUTIONS.hd["9:16"], label: "Portrait", value: "9:16", icon: "rectangle-vertical", category: "portrait" },
  ] as const
).map(withAspectRatioTags);

/**
 * Nano Banana aspect ratios - Fixed output dimensions per aspect ratio (no tiers)
 *
 * Gemini 2.5 Flash Image has fixed output resolutions per aspect ratio:
 * - Supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 * - NO 9:21 (ultra tall) support
 * - Max dimension: 1536px (long edge)
 * - Max pixels: ~1.05 MP (1024×1024 = 1,048,576)
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 1024  | 1024   | 1,048,576 |
 * | 16:9  | 1344  | 768    | 1,032,192 |
 * | 9:16  | 768   | 1344   | 1,032,192 |
 * | 4:3   | 1184  | 864    | 1,023,296 |
 * | 3:4   | 864   | 1184   | 1,023,296 |
 * | 3:2   | 1248  | 832    | 1,038,336 |
 * | 2:3   | 832   | 1248   | 1,038,336 |
 * | 4:5   | 896   | 1152   | 1,032,192 |
 * | 5:4   | 1152  | 896    | 1,032,192 |
 * | 21:9  | 1536  | 672    | 1,032,192 |
 */
export const NANOBANANA_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1344, height: 768, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 768, height: 1344, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1184, height: 864, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 864, height: 1184, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 896, height: 1152, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1152, height: 896, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 1536, height: 672, icon: "monitor", category: "ultrawide" },
  ] as const
).map(withAspectRatioTags);

/**
 * Nano Banana Pro aspect ratios - Uses tiered output dimensions (1K / 2K / 4K)
 *
 * Gemini 3 Pro Image Preview supports 3 output tiers with exact dimensions:
 * - Supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 * - NO 9:21 (ultra tall) support
 * - Max dimension: 6336px (long edge at 4K tier)
 * - Max pixels: ~17.2 MP
 *
 * Maps to our tier system as: HD→1K, 2K→2K, 4K→4K
 * Default aspect ratios shown are for HD (1K) tier; actual dimensions
 * are calculated per tier in the resolution system.
 *
 * HD (1K) Tier:
 * | Ratio | Width | Height |
 * |-------|-------|--------|
 * | 1:1   | 1024  | 1024   |
 * | 2:3   | 848   | 1264   |
 * | 3:2   | 1264  | 848    |
 * | 3:4   | 896   | 1200   |
 * | 4:3   | 1200  | 896    |
 * | 4:5   | 928   | 1152   |
 * | 5:4   | 1152  | 928    |
 * | 9:16  | 768   | 1376   |
 * | 16:9  | 1376  | 768    |
 * | 21:9  | 1584  | 672    |
 *
 * 2K Tier:
 * | Ratio | Width | Height |
 * |-------|-------|--------|
 * | 1:1   | 2048  | 2048   |
 * | 2:3   | 1696  | 2528   |
 * | 3:2   | 2528  | 1696   |
 * | 3:4   | 1792  | 2400   |
 * | 4:3   | 2400  | 1792   |
 * | 4:5   | 1856  | 2304   |
 * | 5:4   | 2304  | 1856   |
 * | 9:16  | 1536  | 2752   |
 * | 16:9  | 2752  | 1536   |
 * | 21:9  | 3168  | 1344   |
 *
 * 4K Tier:
 * | Ratio | Width | Height |
 * |-------|-------|--------|
 * | 1:1   | 4096  | 4096   |
 * | 2:3   | 3392  | 5056   |
 * | 3:2   | 5056  | 3392   |
 * | 3:4   | 3584  | 4800   |
 * | 4:3   | 4800  | 3584   |
 * | 4:5   | 3712  | 4608   |
 * | 5:4   | 4608  | 3712   |
 * | 9:16  | 3072  | 5504   |
 * | 16:9  | 5504  | 3072   |
 * | 21:9  | 6336  | 2688   |
 */
export const NANOBANANA_PRO_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1376, height: 768, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 768, height: 1376, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1200, height: 896, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 896, height: 1200, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1264, height: 848, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 848, height: 1264, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 928, height: 1152, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1152, height: 928, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 1584, height: 672, icon: "monitor", category: "ultrawide" },
  ] as const
).map(withAspectRatioTags);
