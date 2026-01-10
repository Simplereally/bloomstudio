# AI Image Generation Model Dimension & Aspect Ratio Research Report

> **Date:** 2026-01-09  
> **Purpose:** Comprehensive analysis of model constraints, UX challenges, and strategic recommendations for handling dimensions and aspect ratios intelligently in a multi-model image generation platform.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem Space](#the-problem-space)
3. [Model-by-Model Constraint Analysis](#model-by-model-constraint-analysis)
4. [Pollinations API Behavior](#pollinations-api-behavior)
5. [UX Best Practices from Industry](#ux-best-practices-from-industry)
6. [Strategic Recommendations](#strategic-recommendations)
7. [Proposed Architecture](#proposed-architecture)
8. [Aspect Ratio & Resolution Presets](#aspect-ratio--resolution-presets)
9. [Implementation Considerations](#implementation-considerations)

---

## Executive Summary

AI image generation models have wildly varying dimension constraints, ranging from fixed-size outputs (DALL-E 3) to highly flexible megapixel budgets (Seedream 4.5). When working through an aggregator like Pollinations.ai, these constraints become even more opaque because:

1. **No unified API contract** for dimension constraints across models
2. **Silent auto-scaling** — Pollinations may resize images without notification
3. **Model-specific behaviors** — upscaling, fixed presets, aspect ratio limits
4. **Provider variability** — the same model may behave differently depending on backend provider

This report presents research findings and a strategic approach to creating an intelligent, user-friendly dimension/aspect ratio UX that:
- Provides preset aspect ratios with multiple resolution tiers
- Allows custom dimensions for creative flexibility
- Gracefully handles model constraints with clear user feedback
- Sets appropriate expectations about potential output discrepancies

---

## The Problem Space

### Core Challenges

| Challenge | Description |
|-----------|-------------|
| **Varying Pixel Budgets** | Models range from ~590K pixels (SDXL Turbo) to 16MP+ (Seedream 4.5) |
| **Fixed vs Flexible** | Some models only accept specific dimension pairs (DALL-E 3, GPT Image), others allow arbitrary dimensions within constraints |
| **Dimension Minimums/Maximums** | Min dimensions range from 64px to 1024px; max dimensions range from 768px to 16384px |
| **Aspect Ratio Limits** | Seedream enforces 16:1 max aspect ratio; others may have implicit limits |
| **Silent Upscaling** | Some providers upscale outputs beyond requested dimensions |
| **Silent Downscaling** | Pollinations auto-scales requests exceeding 1MP down proportionally |
| **Step Alignment** | Dimensions need to be multiples of 8, 16, 32, or 64 depending on model |

### The Pollinations "Black Box"

Pollinations acts as an intermediary, and their documentation states:
- Default max pixels: **1,048,576 (1MP)** for most models
- **Auto-scaling**: If `width × height > 1MP`, image is scaled down proportionally
- **Model routing**: Some models may use different providers with different behaviors
- **No dimension validation API**: No endpoint to query actual constraints per model

---

## Model-by-Model Constraint Analysis

### Image Generation Models

```
┌─────────────────────┬───────────────┬────────────────┬───────────────┬───────────────┬────────────────┐
│ Model               │ Max Pixels    │ Min Dimension  │ Max Dimension │ Step          │ Notes          │
├─────────────────────┼───────────────┼────────────────┼───────────────┼───────────────┼────────────────┤
│ SDXL Turbo          │ ~590K         │ 64             │ 768           │ 64            │ 512×512 optimal│
│ Flux (via Pollin.)  │ ~1-2MP        │ 256            │ 1440-2048     │ 32            │ 1024×1024 def  │
│ Flux Kontext        │ ~1MP          │ 64             │ 2048          │ 32            │ 3:7 to 7:3 AR  │
│ Z-Image Turbo       │ ~4MP          │ 64             │ 4096          │ 32            │ 1024-1536 train│
│ GPT Image (DALL-E)  │ Fixed         │ 1024           │ 1792          │ N/A           │ 3 presets only │
│ GPT Image Large     │ Fixed         │ 1024           │ 1792          │ N/A           │ 3 presets only │
│ NanoBanana          │ ~1MP          │ 64             │ 2048          │ 32            │ Standard       │
│ NanoBanana Pro      │ ~10MP         │ 1024           │ 4096          │ 16            │ 4K support     │
│ Seedream 4.0        │ 16MP          │ 512            │ 16384         │ 1             │ 16:1 max AR    │
│ Seedream 4.5 Pro    │ 16MP          │ 512            │ 16384         │ 1             │ 16:1 max AR    │
│ Google Imagen 4     │ Fixed tiers   │ 768            │ 2816          │ N/A           │ 1K/2K presets  │
└─────────────────────┴───────────────┴────────────────┴───────────────┴───────────────┴────────────────┘
```

### Detailed Model Breakdowns

#### DALL-E 3 (GPT Image)
- **Type**: Fixed presets only — no custom dimensions
- **Presets**:
  - Square: 1024×1024
  - Landscape: 1792×1024 (approx 16:9)
  - Portrait: 1024×1792 (approx 9:16)
- **UX Strategy**: Disable dimension sliders, show only preset buttons

#### Flux Models (via Pollinations)
- **Claimed Range**: 0.1 - 2MP, with 1414×1414 max for square
- **Practical Optimum**: 1920×1080 for balance of quality/speed
- **Notable**: Dimensions should be divisible by 32 or 64 to avoid artifacts
- **Kontext Variant**: 1024×1024 default, supports 3:7 to 7:3 aspect ratios

#### Seedream 4.0 / 4.5
- **Max Pixels**: 16,777,216 (16MP) — allowing 4096×4096 square
- **Max Dimension**: 16384px on a single axis (extremely high)
- **Aspect Ratio Limit**: width/height must be between 1/16 and 16
- **Min Pixels**: ~262,144 (512×512) to 3,686,400 depending on source
- **Notable**: ByteDance documents claim up to 36MP (6000×6000) for some operations

#### Z-Image Turbo (Alibaba)
- **Training Resolution**: 1024-1536px
- **Reported Capabilities**: Up to 4K (8MP equivalent) with proper settings
- **VRAM Requirement**: 16GB recommended for 2K images
- **Practical**: 2048×2048 (4MP) is safe upper bound

#### Google Imagen (Vertex AI)
- **Imagen 3**: Fixed resolutions only (1024-1408 range)
- **Imagen 4**: Adds 2K tier (2048-2816 range)
- **Aspect Ratios**: 1:1, 3:4, 4:3, 9:16, 16:9
- **Notable**: Resolution specified as "1K" or "2K" tiers, not arbitrary pixels

#### Midjourney (Reference)
- **Default**: 1024×1024 base, 2048×2048 upscaled
- **Aspect Ratios**: ~1:2 to 2:1 range, uses `--ar W:H` syntax
- **Notable**: AI interprets composition based on aspect ratio

### Video Models

```
┌─────────────────────┬───────────────┬────────────────┬───────────────┬────────────────────────┐
│ Model               │ Min Dimension │ Max Dimension  │ Aspect Ratios │ Notes                  │
├─────────────────────┼───────────────┼────────────────┼───────────────┼────────────────────────┤
│ Seedance            │ 720           │ 1920           │ 16:9, 9:16    │ Fixed video dimensions │
│ Seedance Pro        │ 720           │ 1920           │ 16:9, 9:16    │ Fixed video dimensions │
│ Veo 3.1             │ 720           │ 1920           │ 16:9, 9:16    │ Fixed video dimensions │
└─────────────────────┴───────────────┴────────────────┴───────────────┴────────────────────────┘
```

---

## Pollinations API Behavior

### Key Behaviors Observed

1. **Default 1MP Cap**
   - Most requests are capped at 1,048,576 total pixels
   - Requesting 4096×1024 (4MP) → auto-scaled to ~2048×512

2. **Per-Model Overrides**
   - Some models (Seedream, Z-Image) may have higher limits
   - Behavior depends on backend provider routing

3. **No Validation Endpoint**
   - Cannot query API for actual constraints per model
   - Must rely on empirical testing or documentation

4. **Aspect Ratio Preservation**
   - When auto-scaling, aspect ratio is preserved
   - No warning/notification of scaling

### Implications for UX

| Scenario | What User Expects | What May Happen |
|----------|------------------|-----------------|
| Request 4096×4096 with Seedream | 4096×4096 output | May get 4096×4096 OR scaled down |
| Request 2048×2048 with Flux | 2048×2048 output | Likely scaled to ~1024×1024 |
| Request 1920×1080 with SDXL Turbo | 1920×1080 output | Scaled to ~768×432 |
| Request 1024×1792 with GPT Image | 1024×1792 output | Works as expected (preset) |

---

## UX Best Practices from Industry

### Research Summary

Based on analysis of Leonardo.ai, Midjourney, getimg.ai, and general UX guidelines:

#### 1. Preset-First, Custom-Second
- **Default**: Show common aspect ratios as primary selection
- **Custom**: Available but not prominent; requires explicit selection
- **Rationale**: Most users want quick, standard sizes; power users need flexibility

#### 2. Resolution Tiers Within Aspect Ratios
- For each aspect ratio, offer resolution tiers:
  - SD (720p-1080p range)
  - HD (1080p-1440p range)  
  - 2K (1440p-2K range)
  - 4K (UHD range) — if model supports
- **Example**: 16:9 → 1280×720 | 1920×1080 | 2560×1440 | 3840×2160

#### 3. Visual Aspect Ratio Preview
- Show a visual representation of the shape
- Helps users understand proportions intuitively

#### 4. Lock/Unlock for Custom
- Provide aspect ratio lock toggle
- When locked: changing width auto-adjusts height
- When unlocked: fully custom dimensions

#### 5. Model-Aware Constraints
- Dynamically adjust available options based on selected model
- Disable/hide unsupported resolutions
- Show clear indicators of limits

#### 6. Expectation Management
- Show pixel count and megapixel equivalent
- Indicate if output may differ from request
- Consider "output may vary" disclaimers for uncertain models

---

## Strategic Recommendations

### Core Strategy: "Optimistic with Guardrails"

Rather than trying to perfectly predict Pollinations/model behavior, adopt a strategy that:
1. **Offers sensible presets** that are likely to work
2. **Allows flexibility** for creative use cases
3. **Sets clear expectations** about potential output variations
4. **Provides guardrails** that prevent obvious failures

### Recommendation 1: Three-Tier Selection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASPECT RATIO SELECTION                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐   │
│  │ 1:1 │ │16:9 │ │ 9:16│ │ 4:3 │ │ 3:4 │ │21:9 │ │ Custom  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    RESOLUTION TIER (Context-aware)               │
│  ◯ Standard (1MP)   ◯ HD (2MP)   ◯ 2K (4MP)   ◯ 4K (8-16MP)    │
│                     [Disabled if model doesn't support]          │
├─────────────────────────────────────────────────────────────────┤
│                    CUSTOM OVERRIDE (Collapsed by default)        │
│  Width: [____] px   Height: [____] px   🔒 Lock Ratio           │
│  ⚠️ Custom dimensions may be adjusted by the model               │
└─────────────────────────────────────────────────────────────────┘
```

### Recommendation 2: Model Capability Badges

Display clear visual indicators of model capabilities:

```tsx
// Example capability display
<ModelCapabilities>
  <Badge variant="success">16MP</Badge>
  <Badge variant="info">Custom Dims</Badge>
  <Badge variant="warning">May Upscale</Badge>
</ModelCapabilities>
```

### Recommendation 3: Smart Default Selection

When user switches models:
1. Try to preserve current aspect ratio
2. Adjust resolution tier to model's optimal
3. If current dimensions exceed limits, snap to nearest valid

### Recommendation 4: Output Expectation Messaging

For uncertain models, show subtle messaging:

| Model Type | Message |
|------------|---------|
| Fixed (DALL-E) | "Dimensions are fixed for this model" |
| Flexible (Seedream) | "Supports up to 16MP / 4096×4096" |
| Uncertain (via Pollinations) | "Output dimensions may vary from request" |

### Recommendation 5: Megapixel Budget Visualization

```
┌──────────────────────────────────────────────────────────────┐
│ 2.07 MP            ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░    / 16 MP │
│ 1920 × 1080                                         12.9%   │
└──────────────────────────────────────────────────────────────┘
```

---

## Proposed Architecture

### Type Definitions

```typescript
/** Resolution tier for aspect ratio presets */
type ResolutionTier = 'sd' | 'hd' | '2k' | '4k' | 'max'

/** Complete aspect ratio with resolution variants */
interface AspectRatioPreset {
  ratio: string           // e.g., "16:9"
  label: string           // e.g., "Widescreen"
  category: 'square' | 'landscape' | 'portrait' | 'ultrawide'
  resolutions: {
    [K in ResolutionTier]?: {
      width: number
      height: number
      label: string       // e.g., "Full HD 1080p"
    }
  }
}

/** Model dimension capabilities */
interface ModelDimensionCapabilities {
  /** Supports custom dimensions vs fixed presets only */
  customDimensionsEnabled: boolean
  
  /** Supported resolution tiers */
  supportedTiers: ResolutionTier[]
  
  /** Maximum pixels (total W×H) */
  maxPixels: number
  
  /** Minimum pixels */
  minPixels: number
  
  /** Individual dimension limits */
  minDimension: number
  maxDimension: number
  
  /** Required step/alignment */
  step: number
  
  /** Aspect ratio constraints */
  maxAspectRatio?: number  // e.g., 16 for 16:1
  
  /** Output certainty level */
  outputCertainty: 'exact' | 'likely' | 'variable'
  
  /** Warning message if any */
  dimensionWarning?: string
}
```

### Resolution Tier Calculations

```typescript
const RESOLUTION_TIERS: Record<ResolutionTier, { targetMegapixels: number; label: string }> = {
  sd: { targetMegapixels: 0.5, label: 'Standard' },
  hd: { targetMegapixels: 1.0, label: 'HD' },
  '2k': { targetMegapixels: 2.0, label: '2K' },
  '4k': { targetMegapixels: 8.3, label: '4K UHD' },
  max: { targetMegapixels: Infinity, label: 'Maximum' },
}

function calculateDimensionsForTier(
  ratio: { width: number; height: number },
  tier: ResolutionTier,
  constraints: ModelDimensionCapabilities
): { width: number; height: number } {
  const { targetMegapixels } = RESOLUTION_TIERS[tier]
  const aspectRatio = ratio.width / ratio.height
  
  // Calculate base dimensions for target megapixels
  const targetPixels = Math.min(targetMegapixels * 1_000_000, constraints.maxPixels)
  let height = Math.sqrt(targetPixels / aspectRatio)
  let width = height * aspectRatio
  
  // Apply constraints
  width = Math.min(width, constraints.maxDimension)
  height = Math.min(height, constraints.maxDimension)
  
  // Align to step
  width = Math.round(width / constraints.step) * constraints.step
  height = Math.round(height / constraints.step) * constraints.step
  
  return { width, height }
}
```

---

## Aspect Ratio & Resolution Presets

### Recommended Preset Library

#### Square Ratios
| Ratio | Use Cases | SD | HD | 2K | 4K |
|-------|-----------|-----|-----|-----|-----|
| 1:1 | Social profiles, Instagram | 512×512 | 1024×1024 | 1440×1440 | 2048×2048 / 4096×4096 |

#### Landscape Ratios
| Ratio | Use Cases | SD | HD | 2K | 4K |
|-------|-----------|-----|-----|-----|-----|
| 16:9 | YouTube, Desktop, Cinematic | 1280×720 | 1920×1080 | 2560×1440 | 3840×2160 |
| 4:3 | Classic, Print, Presentations | 1024×768 | 1400×1050 | 1920×1440 | 2880×2160 |
| 3:2 | Photography, DSLR | 1080×720 | 1620×1080 | 2160×1440 | 3240×2160 |
| 5:4 | Print, Social wide | 1000×800 | 1400×1120 | 1800×1440 | 2700×2160 |
| 21:9 | Ultrawide, Cinematic | 1680×720 | 2520×1080 | 3360×1440 | 5040×2160 |

#### Portrait Ratios
| Ratio | Use Cases | SD | HD | 2K | 4K |
|-------|-----------|-----|-----|-----|-----|
| 9:16 | Stories, TikTok, Mobile | 720×1280 | 1080×1920 | 1440×2560 | 2160×3840 |
| 3:4 | Portrait photos, Print | 768×1024 | 1050×1400 | 1440×1920 | 2160×2880 |
| 2:3 | Portrait photography | 720×1080 | 1080×1620 | 1440×2160 | 2160×3240 |
| 4:5 | Instagram, Social | 800×1000 | 1080×1350 | 1440×1800 | 2160×2700 |

#### Additional Uncommon Ratios
| Ratio | Use Cases | Notes |
|-------|-----------|-------|
| 9:21 | Ultra-tall mobile | Inverse of 21:9 |
| 7:4 | Close to 16:9, some AI preference | Can work better for some models |
| 5:3 | Between 4:3 and 16:9 | Good middle ground |
| 1.91:1 | Facebook/LinkedIn optimal | Social media specific |

### Model-Specific Preset Availability

```
┌─────────────────────┬────┬────┬─────┬─────┬──────────────────────┐
│ Model               │ SD │ HD │ 2K  │ 4K  │ Custom               │
├─────────────────────┼────┼────┼─────┼─────┼──────────────────────┤
│ SDXL Turbo          │ ✓  │ -  │ -   │ -   │ Limited (max 768px)  │
│ Flux / Kontext      │ ✓  │ ✓  │ -   │ -   │ ✓ (1MP budget)       │
│ Z-Image Turbo       │ ✓  │ ✓  │ ✓   │ -   │ ✓ (4MP budget)       │
│ GPT Image           │ -  │ ✓* │ -   │ -   │ ✗ (Fixed only)       │
│ NanoBanana          │ ✓  │ ✓  │ -   │ -   │ ✓ (1MP budget)       │
│ NanoBanana Pro      │ ✓  │ ✓  │ ✓   │ ✓*  │ ✓ (10MP budget)      │
│ Seedream 4.0/4.5    │ ✓  │ ✓  │ ✓   │ ✓   │ ✓ (16MP budget)      │
│ Google Imagen       │ -  │ ✓  │ ✓** │ -   │ ✗ (Fixed tiers)      │
└─────────────────────┴────┴────┴─────┴─────┴──────────────────────┘

* Limited presets only
** Via 2K tier selection
```

---

## Implementation Considerations

### Phase 1: Enhanced Preset System
1. Expand `AspectRatioOption` type to include resolution tiers
2. Create model-aware preset filtering
3. Add tier selector UI component
4. Update dimension validation logic

### Phase 2: Improved Custom Dimensions
1. Add aspect ratio lock toggle
2. Implement real-time constraint validation
3. Show megapixel budget visualization
4. Add dimension snapping to valid values

### Phase 3: Expectation Management
1. Add `outputCertainty` to model definitions
2. Create "dimensions may vary" messaging system
3. Consider showing actual output dimensions post-generation
4. Log discrepancies for future model tuning

### Phase 4: Smart Defaults & Transitions
1. Implement intelligent dimension preservation on model switch
2. Add "closest valid" snapping for out-of-range dimensions
3. Remember user preferences per aspect ratio

### Testing Strategy

| Test Case | Expected Behavior |
|-----------|-------------------|
| Switch from Seedream (4K) to SDXL Turbo | Snap to 768×432 (nearest 16:9) |
| Request 4096×4096 on Flux | Show warning, may scale to ~1024×1024 |
| Select Custom on GPT Image | Show "Not available" or disabled state |
| Exceed 16:1 ratio on Seedream | Prevent/warn before submission |
| Switch from 16:9 to 1:1 on same model | Recalculate to square at same resolution tier |

---

## Conclusion

The dimension/aspect ratio challenge requires a pragmatic approach that balances user flexibility with model constraints and the inherent uncertainty of working through aggregators like Pollinations.

**Key Takeaways:**

1. **Embrace uncertainty** — Not all outputs will match inputs; manage expectations
2. **Presets reduce errors** — Well-designed presets guide users to valid configurations
3. **Custom requires guardrails** — Allow flexibility but with clear constraint feedback
4. **Model differences matter** — The UI must adapt to each model's capabilities
5. **Resolution tiers simplify choice** — Users don't need to know exact pixels

By implementing the three-tier selection architecture (Aspect Ratio → Resolution Tier → Optional Custom), combined with model-aware constraints and clear expectation messaging, the platform can provide both power-user flexibility and novice-friendly simplicity.

---

## References

- Pollinations.ai API Documentation: https://github.com/pollinations/pollinations
- Flux Model Documentation: https://bfl.ml/
- Seedream via BytePlus: https://byteplus.com
- DALL-E 3 Sizing Guide: https://openai.com
- SDXL Turbo: https://huggingface.co/stabilityai/sdxl-turbo
- Midjourney Documentation: https://docs.midjourney.com
- Leonardo.ai Help: https://intercom.help/leonardo-ai
- Google Vertex AI Imagen: https://cloud.google.com/vertex-ai
