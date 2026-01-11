# NSFW / Sensitive Content Detection & Tagging System

## Overview

Implement an automated system to detect and tag sensitive (NSFW) content in user-generated images and videos. Tagged content should be hidden behind a blur/overlay on public feed pages, with user settings to control visibility preferences.

**Created:** 2026-01-12

---

## Goals

1. Automatically detect and tag sensitive content before it appears on the public feed
2. Protect users from unexpected NSFW content exposure (default-safe experience)
3. Allow signed-in users to override visibility settings in their preferences
4. Maintain platform integrity while supporting NSFW-capable models
5. Minimize false positives (over-censoring) and false negatives (exposure to explicit content)

---

## Current State Analysis

### Relevant Schema (from `convex/schema.ts`)

The `generatedImages` table currently lacks any sensitive content fields:

```typescript
generatedImages: defineTable({
    ownerId: v.string(),
    visibility: v.union(v.literal("public"), v.literal("unlisted")),
    // ... other fields
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    model: v.string(),
    // No sensitive content fields exist
})
```

### Generation Flow (relevant files)

- `convex/singleGenerationProcessor.ts` - Single image generation
- `convex/batchProcessor.ts` - Batch image generation
- `convex/generatedImages.ts` - Image CRUD operations
- `convex/lib/pollinations.ts` - API calls to Pollinations

### Feed Pages

- `getPublicFeed` query returns public images for community feed
- No filtering for sensitive content currently exists
- Following feed also shows all public images from followed users

---

## Detection Strategy Options

### Strategy 1: Prompt-Based Keyword Detection

**Approach:** Analyze text prompts for NSFW keywords before/during/after generation.

**Pros:**
- ✅ Zero additional cost - no external API calls
- ✅ Fast - can run synchronously during generation
- ✅ Predictive - can flag before image is even generated
- ✅ Works offline (no external dependencies)

**Cons:**
- ❌ **High bypass rate** - users can use euphemisms, misspellings, foreign languages
- ❌ **False positives** - e.g., "breast cancer awareness" flagged as sensitive
- ❌ **Limited coverage** - can't detect visual NSFW content from innocent-sounding prompts
- ❌ **Maintenance burden** - keyword lists require constant updates

**Implementation Complexity:** Low

**Sample Keywords List:**
```typescript
const NSFW_KEYWORDS = [
    // Explicit terms (heavily truncated for document)
    "nude", "naked", "nsfw", "explicit", "pornographic",
    "erotic", "xxx", "uncensored", "hentai",
    // Body-related terms in sexual context
    "topless", "bottomless", "busty", "voluptuous",
    // ... extensive list needed
];

const CONTEXT_MODIFIERS = [
    // Terms that when combined with body parts suggest NSFW
    "revealing", "seductive", "provocative", "sensual"
];
```

**Confidence Scoring:**
| Match Type | Score |
|------------|-------|
| Explicit NSFW term | 0.9 |
| Body part + context modifier | 0.7 |
| Suggestive term alone | 0.4 |

**Recommended Threshold:** `>= 0.6` for automatic tagging

---

### Strategy 2: Image Analysis via OpenRouter Vision Models

**Approach:** Use free/low-cost vision-capable LLMs via OpenRouter to analyze generated images.

**Pros:**
- ✅ **Accurate visual detection** - catches content regardless of prompt
- ✅ **Handles bypass attempts** - analyzes actual output
- ✅ **Contextual understanding** - can differentiate art from explicit content
- ✅ **Confidence scoring** - provides nuanced responses
- ✅ **Free tier available** - OpenRouter offers free vision models

**Cons:**
- ❌ **Latency** - adds processing time after generation
- ❌ **Cost at scale** - even cheap models add up (though free tier helps)
- ❌ **External dependency** - relies on third-party service
- ❌ **Rate limits** - free models have usage restrictions
- ❌ **Some models refuse** - OpenAI/Anthropic models may refuse to analyze NSFW content

**Implementation Complexity:** Medium

**Free Vision Models on OpenRouter (as of Jan 2026):**

| Model | Vision Support | NSFW Analysis | Notes |
|-------|----------------|---------------|-------|
| `google/gemma-3-27b` | ✅ | Moderate | Free, multimodal |
| `google/gemini-2.0-flash-exp` | ✅ | Limited | May refuse explicit content |
| `meta-llama/llama-4-maverick` | ✅ | Good | Free, less restrictive |
| `qwen/qwen2.5-vl-72b` | ✅ | Good | Free, strong visual understanding |
| `mistralai/mistral-small-3.2-24b` | ✅ | Good | Free, fewer guardrails |

**Recommended Prompt for Analysis:**
```
Analyze this image for content appropriateness. Rate the content on these categories:
1. Nudity (none/partial/full)
2. Sexual content (none/suggestive/explicit)
3. Violence (none/mild/graphic)

Respond in JSON format:
{
  "nudity": "none" | "partial" | "full",
  "sexual_content": "none" | "suggestive" | "explicit",
  "violence": "none" | "mild" | "graphic",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}
```

**Scoring Matrix:**
| Category | Level | Score Weight |
|----------|-------|--------------|
| Nudity | partial | +0.4 |
| Nudity | full | +0.9 |
| Sexual | suggestive | +0.3 |
| Sexual | explicit | +0.9 |
| Violence | mild | +0.2 |
| Violence | graphic | +0.7 |

**Tag as Sensitive if:** Total score >= 0.5

---

### Strategy 3: Dedicated NSFW Detection APIs

**Approach:** Use specialized NSFW detection services designed for this purpose.

**Options Researched:**

| Service | Free Tier | Accuracy | Notes |
|---------|-----------|----------|-------|
| **SmartClick NSFW** | 3,000 req/month | High | 15+ content classes |
| **API4AI NSFW** | 25 credits | High | API-first approach |
| **Eden AI** | 1 req/sec (free team) | High | Aggregates multiple providers |
| **JigsawStack** | Free tier available | Medium | NSFW detection API |
| **Google Cloud Vision** | $300 credit | Very High | SafeSearch detection |
| **Azure AI Vision** | $200 credit | Very High | Content moderation API |
| **Amazon Rekognition** | $Free tier | Very High | Moderation labels |

**Pros:**
- ✅ **Purpose-built** - optimized specifically for NSFW detection
- ✅ **High accuracy** - trained on large datasets
- ✅ **Fast** - optimized for speed
- ✅ **Detailed categorization** - nudity, violence, hate symbols, etc.

**Cons:**
- ❌ **Cost** - Free tiers are limited; paid tiers can be expensive at scale
- ❌ **External dependency** - another service to manage
- ❌ **Privacy concerns** - images sent to third-party

**Implementation Complexity:** Medium

---

### Strategy 4: Community Flagging / Reporting

**Approach:** Allow users to report content as sensitive.

**Pros:**
- ✅ **Zero cost** - no external services
- ✅ **Human judgment** - catches context AI might miss
- ✅ **Community ownership** - users help moderate
- ✅ **Cultural awareness** - humans understand context better

**Cons:**
- ❌ **Reactive only** - content is visible until reported
- ❌ **Abuse potential** - false reports, brigading
- ❌ **Moderation overhead** - requires review queue
- ❌ **Inconsistent** - varies by reporter perspective

**Implementation Complexity:** Medium (requires moderation queue)

**Schema Addition:**
```typescript
contentReports: defineTable({
    reporterId: v.string(),
    imageId: v.id("generatedImages"),
    reason: v.union(
        v.literal("nudity"),
        v.literal("sexual"),
        v.literal("violence"),
        v.literal("other")
    ),
    additionalInfo: v.optional(v.string()),
    status: v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("dismissed")
    ),
    createdAt: v.number(),
})
```

---

### Strategy 5: Hybrid Multi-Layer Approach ⭐ RECOMMENDED

**Approach:** Combine multiple strategies in layers for comprehensive coverage.

```
┌─────────────────────────────────────────────────────────────┐
│                    GENERATION FLOW                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Prompt Analysis (Sync, Pre-generation)            │
│  - Keyword matching                                          │
│  - High-confidence explicit terms → Auto-tag                 │
│  - Flag for Layer 2 if score > 0.3                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Vision Analysis (Async, Post-generation)          │
│  - Run for flagged prompts OR all images                     │
│  - Use free OpenRouter vision model                          │
│  - Update sensitiveContent field                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Community Reporting (Ongoing)                     │
│  - User flagging mechanism                                   │
│  - Override AI decisions                                     │
│  - Feed into model improvements                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Implementation Plan

### Phase 1: Schema & Database Updates (Priority: Critical)

**1.1 Update `generatedImages` schema:**

```typescript
generatedImages: defineTable({
    // ... existing fields
    
    /** Whether this content is marked as sensitive/NSFW */
    isSensitive: v.optional(v.boolean()),
    
    /** How the sensitive flag was determined */
    sensitiveSource: v.optional(v.union(
        v.literal("prompt_analysis"),
        v.literal("vision_analysis"),
        v.literal("community_report"),
        v.literal("owner_marked"),
        v.literal("admin_override")
    )),
    
    /** Confidence score from automated detection (0-1) */
    sensitiveConfidence: v.optional(v.number()),
    
    /** Detailed content analysis results */
    contentAnalysis: v.optional(v.object({
        nudity: v.optional(v.string()),
        sexual: v.optional(v.string()),
        violence: v.optional(v.string()),
        analyzedAt: v.number(),
    })),
})
    // Add index for filtering sensitive content
    .index("by_visibility_sensitive", ["visibility", "isSensitive", "createdAt"])
```

**1.2 Update `users` schema for preferences:**

```typescript
users: defineTable({
    // ... existing fields
    
    /** Whether to show sensitive content without blur (default: false) */
    showSensitiveContent: v.optional(v.boolean()),
})
```

**Files to Modify:**
- `convex/schema.ts`

---

### Phase 2: Prompt Analysis (Priority: High)

**2.1 Create keyword detection utility:**

```typescript
// convex/lib/nsfwDetection.ts

const EXPLICIT_KEYWORDS = new Set([
    "nude", "naked", "nsfw", "explicit", "pornographic",
    "erotic", "xxx", "uncensored", "hentai", "topless",
    // ... extensive list
]);

const SUGGESTIVE_KEYWORDS = new Set([
    "seductive", "provocative", "sensual", "revealing",
    "bikini", "lingerie", "boudoir",
    // ... extensive list
]);

const BODY_PARTS = new Set([
    "breast", "butt", "thigh", "cleavage",
    // ... list
]);

const CONTEXT_MODIFIERS = new Set([
    "exposed", "bare", "showing", "flashing",
    // ... list
]);

export interface PromptAnalysisResult {
    isSensitive: boolean;
    confidence: number;
    matchedTerms: string[];
    detectionMethod: "explicit" | "contextual" | "none";
}

export function analyzePromptForNSFW(prompt: string): PromptAnalysisResult {
    const normalizedPrompt = prompt.toLowerCase();
    const words = normalizedPrompt.split(/\s+/);
    const matchedTerms: string[] = [];
    let score = 0;
    
    // Check explicit keywords
    for (const word of words) {
        if (EXPLICIT_KEYWORDS.has(word)) {
            matchedTerms.push(word);
            score += 0.9;
        } else if (SUGGESTIVE_KEYWORDS.has(word)) {
            matchedTerms.push(word);
            score += 0.4;
        }
    }
    
    // Check body part + context modifier combinations
    const hasBodyPart = words.some(w => BODY_PARTS.has(w));
    const hasModifier = words.some(w => CONTEXT_MODIFIERS.has(w));
    if (hasBodyPart && hasModifier) {
        score += 0.5;
    }
    
    // Normalize score to 0-1 range
    const confidence = Math.min(score, 1);
    
    return {
        isSensitive: confidence >= 0.6,
        confidence,
        matchedTerms,
        detectionMethod: matchedTerms.length > 0 ? "explicit" : 
                         (hasBodyPart && hasModifier) ? "contextual" : "none"
    };
}
```

**2.2 Integrate into generation flow:**

Update `convex/generatedImages.ts` → `create` mutation:

```typescript
export const create = mutation({
    args: {
        // ... existing args
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        
        // Analyze prompt for NSFW content
        const promptAnalysis = analyzePromptForNSFW(args.prompt);
        
        const imageId = await ctx.db.insert("generatedImages", {
            // ... existing fields
            
            // New sensitive content fields
            isSensitive: promptAnalysis.isSensitive,
            sensitiveSource: promptAnalysis.isSensitive ? "prompt_analysis" : undefined,
            sensitiveConfidence: promptAnalysis.confidence,
        });
        
        // Schedule async vision analysis if prompt was borderline
        if (promptAnalysis.confidence > 0.3 && promptAnalysis.confidence < 0.8) {
            await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeImage, {
                imageId,
            });
        }
        
        return imageId;
    },
});
```

**Files to Create/Modify:**
- `convex/lib/nsfwDetection.ts` (new)
- `convex/generatedImages.ts` (modify create mutation)

---

### Phase 3: Vision Analysis (Priority: Medium)

**3.1 Create OpenRouter integration:**

```typescript
// convex/lib/openrouter.ts
"use node"

interface ContentAnalysisResult {
    nudity: "none" | "partial" | "full";
    sexual_content: "none" | "suggestive" | "explicit";
    violence: "none" | "mild" | "graphic";
    confidence: number;
    reasoning: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ANALYSIS_MODEL = "qwen/qwen2.5-vl-72b:free"; // Free vision model

export async function analyzeImageContent(imageUrl: string): Promise<ContentAnalysisResult> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: ANALYSIS_MODEL,
            messages: [{
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: { url: imageUrl }
                    },
                    {
                        type: "text",
                        text: `Analyze this image for content appropriateness. Classify:
1. Nudity: none/partial/full
2. Sexual content: none/suggestive/explicit  
3. Violence: none/mild/graphic

Respond ONLY with valid JSON:
{"nudity":"none|partial|full","sexual_content":"none|suggestive|explicit","violence":"none|mild|graphic","confidence":0.0-1.0,"reasoning":"brief explanation"}`
                    }
                ]
            }],
            temperature: 0.1, // Low temp for consistent classification
        }),
    });
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    return JSON.parse(content);
}

export function calculateSensitivityScore(analysis: ContentAnalysisResult): number {
    let score = 0;
    
    if (analysis.nudity === "partial") score += 0.4;
    if (analysis.nudity === "full") score += 0.9;
    
    if (analysis.sexual_content === "suggestive") score += 0.3;
    if (analysis.sexual_content === "explicit") score += 0.9;
    
    if (analysis.violence === "mild") score += 0.2;
    if (analysis.violence === "graphic") score += 0.7;
    
    return Math.min(score, 1);
}
```

**3.2 Create content analysis action:**

```typescript
// convex/contentAnalysis.ts
"use node"

import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { analyzeImageContent, calculateSensitivityScore } from "./lib/openrouter";

export const analyzeImage = internalAction({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        // Get image data
        const image = await ctx.runQuery(internal.generatedImages.getByIdInternal, {
            imageId: args.imageId,
        });
        
        if (!image || !image.url) {
            console.log(`Image ${args.imageId} not found or no URL`);
            return;
        }
        
        try {
            // Analyze with vision model
            const analysis = await analyzeImageContent(image.url);
            const sensitivityScore = calculateSensitivityScore(analysis);
            
            // Update image with analysis results
            await ctx.runMutation(internal.contentAnalysis.updateImageSensitivity, {
                imageId: args.imageId,
                isSensitive: sensitivityScore >= 0.5,
                confidence: sensitivityScore * analysis.confidence,
                contentAnalysis: {
                    nudity: analysis.nudity,
                    sexual: analysis.sexual_content,
                    violence: analysis.violence,
                    analyzedAt: Date.now(),
                },
            });
        } catch (error) {
            console.error(`Failed to analyze image ${args.imageId}:`, error);
        }
    },
});

export const updateImageSensitivity = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        isSensitive: v.boolean(),
        confidence: v.number(),
        contentAnalysis: v.object({
            nudity: v.optional(v.string()),
            sexual: v.optional(v.string()),
            violence: v.optional(v.string()),
            analyzedAt: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.imageId, {
            isSensitive: args.isSensitive,
            sensitiveSource: "vision_analysis",
            sensitiveConfidence: args.confidence,
            contentAnalysis: args.contentAnalysis,
        });
    },
});

// Cron job to analyze recently created images that haven't been analyzed
export const analyzeRecentImages = internalAction({
    args: {},
    handler: async (ctx) => {
        const unanalyzedImages = await ctx.runQuery(
            internal.contentAnalysis.getUnanalyzedImages,
            { limit: 50 }
        );
        
        for (const image of unanalyzedImages) {
            await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeImage, {
                imageId: image._id,
            });
        }
    },
});
```

**3.3 Add cron job for ongoing analysis:**

```typescript
// Update convex/crons.ts
crons.interval(
    "analyze unanalyzed images",
    { hours: 1 },
    internal.contentAnalysis.analyzeRecentImages,
);
```

**Files to Create/Modify:**
- `convex/lib/openrouter.ts` (new)
- `convex/contentAnalysis.ts` (new)
- `convex/crons.ts` (add cron job)

---

### Phase 4: Feed Filtering (Priority: High)

**4.1 Update public feed query:**

```typescript
// convex/generatedImages.ts

export const getPublicFeed = query({
    args: {
        paginationOpts: paginationOptsValidator,
        /** Whether to include sensitive content (requires user preference) */
        includeSensitive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { includeSensitive = false } = args;
        
        // Build query with optional sensitive filter
        let results;
        if (includeSensitive) {
            results = await ctx.db
                .query("generatedImages")
                .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
                .order("desc")
                .paginate(args.paginationOpts);
        } else {
            results = await ctx.db
                .query("generatedImages")
                .withIndex("by_visibility_sensitive", (q) => 
                    q.eq("visibility", "public").eq("isSensitive", false)
                )
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        // Enrich with owner info
        const enrichedPage = await enrichImages(ctx, results.page);
        
        return {
            ...results,
            page: enrichedPage,
        };
    },
});
```

**4.2 Create user preference mutation:**

```typescript
// convex/users.ts

export const updateSensitiveContentPreference = mutation({
    args: {
        showSensitiveContent: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        
        if (!user) throw new Error("User not found");
        
        await ctx.db.patch(user._id, {
            showSensitiveContent: args.showSensitiveContent,
            updatedAt: Date.now(),
        });
    },
});

export const getSensitiveContentPreference = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false; // Default to hiding for unauthenticated
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();
        
        return user?.showSensitiveContent ?? false;
    },
});
```

**Files to Modify:**
- `convex/generatedImages.ts`
- `convex/users.ts`

---

### Phase 5: Frontend UI Changes (Priority: High)

**5.1 Create SensitiveContentOverlay component:**

```tsx
// components/ui/sensitive-content-overlay.tsx
"use client"

import { useState } from "react"
import { Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SensitiveContentOverlayProps {
    className?: string
    onReveal?: () => void
}

export function SensitiveContentOverlay({ 
    className,
    onReveal 
}: SensitiveContentOverlayProps) {
    const [revealed, setRevealed] = useState(false)
    
    if (revealed) return null
    
    return (
        <div 
            className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center",
                "bg-black/60 backdrop-blur-xl",
                "rounded-lg cursor-pointer",
                className
            )}
            onClick={() => {
                setRevealed(true)
                onReveal?.()
            }}
        >
            <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
            <span className="text-white font-medium text-sm">Sensitive Content</span>
            <span className="text-white/60 text-xs mt-1">Click to reveal</span>
        </div>
    )
}
```

**5.2 Update ImageCard component:**

```tsx
// Update components/ui/image-card.tsx

interface ImageCardProps {
    // ... existing props
    isSensitive?: boolean
    userShowsSensitive?: boolean
}

export function ImageCard({ 
    isSensitive = false,
    userShowsSensitive = false,
    ...props 
}: ImageCardProps) {
    const showOverlay = isSensitive && !userShowsSensitive
    
    return (
        <div className="relative ...">
            {/* Existing image content */}
            <Image ... />
            
            {/* Sensitive content overlay */}
            {showOverlay && <SensitiveContentOverlay />}
        </div>
    )
}
```

**5.3 Add settings toggle:**

```tsx
// Update components/settings/... or create new section

export function ContentPreferencesSection() {
    const showSensitive = useQuery(api.users.getSensitiveContentPreference)
    const updatePreference = useMutation(api.users.updateSensitiveContentPreference)
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Content Preferences</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Show Sensitive Content</p>
                        <p className="text-sm text-muted-foreground">
                            Display NSFW content without blur overlay
                        </p>
                    </div>
                    <Switch
                        checked={showSensitive ?? false}
                        onCheckedChange={(checked) => 
                            updatePreference({ showSensitiveContent: checked })
                        }
                    />
                </div>
            </CardContent>
        </Card>
    )
}
```

**Files to Create/Modify:**
- `components/ui/sensitive-content-overlay.tsx` (new)
- `components/ui/image-card.tsx` (modify)
- `components/settings/content-preferences.tsx` (new or modify existing)

---

### Phase 6: Community Reporting (Priority: Low)

**6.1 Create reports table and mutations:**

```typescript
// Add to convex/schema.ts
contentReports: defineTable({
    reporterId: v.string(),
    imageId: v.id("generatedImages"),
    reason: v.union(
        v.literal("nudity"),
        v.literal("sexual"),
        v.literal("violence"),
        v.literal("other")
    ),
    additionalInfo: v.optional(v.string()),
    status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("dismissed")
    ),
    reviewedBy: v.optional(v.string()),
    createdAt: v.number(),
})
    .index("by_image", ["imageId"])
    .index("by_status", ["status", "createdAt"])
    .index("by_reporter", ["reporterId", "createdAt"])
```

**6.2 Create report mutation:**

```typescript
// convex/contentReports.ts

export const reportImage = mutation({
    args: {
        imageId: v.id("generatedImages"),
        reason: v.union(
            v.literal("nudity"),
            v.literal("sexual"),
            v.literal("violence"),
            v.literal("other")
        ),
        additionalInfo: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        
        // Check for duplicate report
        const existingReport = await ctx.db
            .query("contentReports")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .filter((q) => q.eq(q.field("reporterId"), identity.subject))
            .first();
        
        if (existingReport) {
            throw new Error("You have already reported this content");
        }
        
        await ctx.db.insert("contentReports", {
            reporterId: identity.subject,
            imageId: args.imageId,
            reason: args.reason,
            additionalInfo: args.additionalInfo,
            status: "pending",
            createdAt: Date.now(),
        });
        
        // Auto-flag if multiple reports
        const reportCount = await ctx.db
            .query("contentReports")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .collect();
        
        if (reportCount.length >= 3) {
            await ctx.db.patch(args.imageId, {
                isSensitive: true,
                sensitiveSource: "community_report",
            });
        }
    },
});
```

**Files to Create:**
- `convex/contentReports.ts`

---

## Cost Analysis

### OpenRouter Vision Analysis Costs

Based on free tier models:

| Scenario | Monthly Images | Cost |
|----------|---------------|------|
| Startup (1,000 images/month) | 1,000 | $0 (free tier) |
| Growth (10,000 images/month) | 10,000 | ~$5-20 |
| Scale (100,000 images/month) | 100,000 | ~$50-200 |

**Cost Reduction Strategies:**
1. Only analyze images with borderline prompt scores (0.3-0.8)
2. Batch analysis during off-peak hours
3. Cache analysis results (already stored in DB)
4. Use sampling for high-volume periods

---

## Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenRouter rate limits | Medium | Implement queue with backoff, use multiple free models |
| Vision model refuses NSFW | Medium | Use less restrictive models (Qwen, Mistral) |
| False positives hurt UX | High | Tune thresholds conservatively, allow user override |
| False negatives expose users | High | Combine with community reporting, conservative defaults |
| Prompt bypass (euphemisms) | Medium | Vision analysis catches visual content regardless |
| Model API changes | Low | Abstract API calls, add fallback models |
| Performance impact | Low | Async analysis, don't block generation |

---

## Implementation Priority Matrix

| Phase | Priority | Effort | Impact | Dependencies |
|-------|----------|--------|--------|--------------|
| 1. Schema Updates | Critical | Low | High | None |
| 2. Prompt Analysis | High | Medium | Medium | Phase 1 |
| 3. Vision Analysis | Medium | High | High | Phase 1 |
| 4. Feed Filtering | High | Medium | Critical | Phase 1/2 |
| 5. Frontend UI | High | Medium | Critical | Phase 4 |
| 6. Community Reports | Low | Medium | Medium | Phase 1 |

---

## Recommended MVP Approach

For the fastest path to value, implement in this order:

### Week 1: Foundation
1. ✅ Schema updates (isSensitive, sensitiveSource fields)
2. ✅ Prompt-based keyword detection
3. ✅ Feed filtering to exclude sensitive content from public feed

### Week 2: UI & UX
4. ✅ SensitiveContentOverlay component
5. ✅ User preference setting in account settings
6. ✅ Click-to-reveal on feed pages

### Week 3: Vision Analysis (Optional Enhancement)
7. ⏳ OpenRouter integration
8. ⏳ Async image analysis action
9. ⏳ Cron job for batch analysis

### Week 4: Community Layer (Future)
10. 🔜 Community reporting system
11. 🔜 Moderation queue for admins
12. 🔜 Appeal system

---

## Environment Variables Required

```env
# OpenRouter API Key (for vision analysis)
OPENROUTER_API_KEY=sk-or-v1-...

# Optional: Dedicated NSFW API (if not using OpenRouter)
NSFW_API_KEY=...
NSFW_API_ENDPOINT=...
```

---

## Related Files Summary

### Core Files to Create
- `convex/lib/nsfwDetection.ts` - Keyword detection utility
- `convex/lib/openrouter.ts` - OpenRouter API client
- `convex/contentAnalysis.ts` - Image analysis actions
- `convex/contentReports.ts` - Community reporting
- `components/ui/sensitive-content-overlay.tsx` - Blur overlay component
- `components/settings/content-preferences.tsx` - User settings section

### Core Files to Modify
- `convex/schema.ts` - Add isSensitive, sensitiveSource, contentAnalysis fields
- `convex/generatedImages.ts` - Update create mutation, add filtered queries
- `convex/users.ts` - Add showSensitiveContent preference
- `convex/crons.ts` - Add analysis cron job
- `components/ui/image-card.tsx` - Add overlay support
- `components/gallery/paginated-image-grid.tsx` - Pass sensitivity props

### Supporting Files
- `hooks/use-sensitive-content.ts` - User preference hook
- `lib/constants.ts` - NSFW keyword lists (or separate file)

---

## References

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [SmartClick NSFW API](https://smartclick.ai/api/nsfw-images-detection-and-classification/)
- [API4AI NSFW Recognition](https://api4.ai/apis/nsfw)
- [Best Practices for Content Moderation](https://dev.to/topics/content-moderation)
- [Community Moderation Design Patterns](https://getstream.io/blog/content-moderation/)

---

## Questions to Resolve

1. **Threshold tuning:** What's the acceptable false positive rate? (Suggested: <5%)
2. **Owner marking:** Should image creators be able to pre-mark their content as sensitive?
3. **Model-based flagging:** Should certain models (known for NSFW) have stricter defaults?
4. **Video content:** Does video require different detection strategies?
5. **Appeals process:** How should users contest incorrect automated flags?
6. **Admin tooling:** Do we need a moderation dashboard for reviewing reports?

---

## Next Steps

1. Review this document and decide on MVP scope
2. Approve schema changes for Phase 1
3. Create development branch for implementation
4. Set up OpenRouter API key in environment (if pursuing vision analysis)
5. Begin implementation following priority matrix
