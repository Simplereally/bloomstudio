# Dirtberry Cropping Implementation Notes

## Goal

- Make `dirtberry` portrait-only and show **post-crop dimensions** in Studio (`832x1144`).
- Remove Dirtberry corner marks by cropping **before** persistence.
- Keep downstream rendering/export simple by storing a pre-cropped source.

## Final Approach (Server-Side, Pre-Upload)

Cropping is applied in Convex after Pollinations returns image bytes and before R2 upload:

1. Fetch Pollinations image bytes in `convex/singleGenerationProcessor.ts`.
2. If `model` resolves to Dirtberry:
   - Crop 3% from top and 3% from bottom using `convex/lib/dirtberryCrop.ts`.
3. Upload the cropped buffer to R2.
4. Persist cropped dimensions in `generatedImages` (and Dirtberry generation params).

Result: Gallery, canvas, lightbox, and downloads all use the same already-cropped asset.

## Crop Math

- `TRIM_FRACTION = 0.03`
- `trimPixels = round(H * 0.03)`
- `croppedHeight = H - (2 * trimPixels)`
- For source `H = 1216`: `trimPixels = 36`, `croppedHeight = 1144`

## Required Code Touchpoints

- `lib/config/models.ts`
  - Dirtberry aspect ratios reduced to one preset (`9:16`, `832x1144` display dimensions)
  - Dirtberry default dimensions updated to `832x1144`
- `hooks/use-generation-settings.ts`
  - Fixed single-tier models use exact preset dimensions on model switch
- `convex/lib/dirtberryCrop.ts`
  - Crop-region math + buffer crop utility
- `convex/singleGenerationProcessor.ts`
  - Force Dirtberry upstream request dimensions to source size (`832x1216`)
  - Wire Dirtberry crop before `uploadMediaWithThumbnail(...)`
- `convex/batchProcessor.ts`
  - Apply the same Dirtberry source-dimension + pre-upload crop logic for batch jobs

## Validation Checklist

1. Select `dirtberry` -> one aspect option with displayed dimensions `832x1144`.
2. Generate Dirtberry image -> no visible corner watermark in Studio surfaces.
3. Download image -> dimensions reflect cropped output (`832x1144`).
4. Generate non-Dirtberry model -> no behavior change.
