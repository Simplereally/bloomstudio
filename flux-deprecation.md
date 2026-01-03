Summary: Removed Flux Model and Updated Default to Z-IMAGE-TURBO
I've successfully completed the task of removing the "Flux" model and updating "Z-IMAGE-TURBO" to be the default. Here's what was changed:

Core Configuration Changes
lib/config/models.ts
Removed the flux model definition from MODEL_REGISTRY
Updated comment about STANDARD_ASPECT_RATIOS to not mention Flux
lib/schemas/pollinations.schema.ts
Removed "flux" from KnownImageModelSchema
Changed default model from "flux" to "zimage" in ImageGenerationParamsSchema
hooks/use-generation-settings.ts
Changed default model from "flux" to "zimage"
Updated default dimensions from 1024x1024 to 2048x2048 (matching zimage defaults)
UI Component Updates
components/studio/controls/dimension-controls.tsx
 - Updated default modelId prop from "flux" to "zimage"
components/studio/canvas/image-metadata.tsx
 - Updated fallback model display from "flux" to "zimage"
components/image-generator/image-display.tsx
 - Updated fallback model display from "flux" to "zimage"
app/api/generate-batch-item/route.ts
 - Updated default model fallback from "flux" to "zimage"
Error Handling Updates
lib/errors/pollinations-error.ts
Updated MODEL_UNAVAILABLE error message to be model-agnostic
Added @deprecated JSDoc annotations to FLUX_UNAVAILABLE pattern and 
isFluxModelUnavailable
 function (kept for legacy error handling)
Documentation Updates
Updated JSDoc examples in:
hooks/use-dimension-info.ts
hooks/use-dimension-constraints.ts
hooks/queries/use-generate-image.ts
Test File Updates
Updated 17+ test files to use "zimage" instead of "flux" as the test model in mock data and assertions:

lib/config/models.test.ts
 - Updated model counts (12 models instead of 13, 9 image models instead of 10)
lib/schemas/pollinations.schema.test.ts
lib/pollinations-api.test.ts
lib/api/image-api.test.ts
lib/api/models-api.test.ts
hooks/use-generation-settings.test.ts
hooks/use-dimension-constraints.test.ts
hooks/use-random-seed.test.ts
hooks/queries/use-image-models.test.ts
hooks/queries/use-generation-history.test.ts
hooks/use-studio-ui.test.ts
hooks/use-batch-mode.test.ts
hooks/use-image-display.test.ts
hooks/queries/use-generate-image.test.tsx
components/studio/controls/model-selector.test.tsx
convex/lib/pollinations.test.ts

---

## Post-Deprecation Fix (2026-01-03)

### Issue: History Filters Missing Flux Option
After removal, users couldn't filter their history by "Flux" generations because the filter dropdown only showed models in `MODEL_REGISTRY`.

### Fix Applied:
**components/gallery/history-filters.tsx**
- Added `LEGACY_FILTER_MODELS` constant for deprecated models that can still be filtered
- Created `ALL_FILTERABLE_MODELS` combining active and legacy models
- Updated filter dropdown to show both active and legacy models (legacy shown with `opacity-60`)
- Updated `ActiveFilterBadges` to use the combined list for display name lookup

This ensures existing Flux generations remain filterable while clearly indicating the model is legacy.