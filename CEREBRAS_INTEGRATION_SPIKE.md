# Spike: Cerebras Integration for Text-to-Text Inference

## Context

We currently use Groq for both text-to-text (prompt enhancement, suggestions) and vision (NSFW detection). To preserve Groq's vision quota (1,000 RPD), we want to offload text-to-text to Cerebras, which offers extremely fast inference and generous free tier limits.

**Current Architecture:**
- `lib/ai-provider/` - Unified text provider (Groq primary → OpenRouter fallback)
- `lib/groq/` - Groq client for text generation
- `convex/lib/groq.ts` - Groq vision client for NSFW detection
- `convex/lib/visionAnalysis.ts` - Unified vision provider (Groq → OpenRouter fallback)

**Goal:** Replace Groq with Cerebras for text-to-text only. Keep Groq exclusively for vision.

---

## Cerebras Overview

**API:** OpenAI-compatible REST API  
**Free Tier:** 30 RPM, 60k TPM, 1B tokens/month
**Speed:** ~2,000 tokens/sec (fastest inference available)

### Recommended Model
- `llama-3.3-70b` - Best balance of quality and speed for prompt enhancement

### API Endpoint
```
POST https://api.cerebras.ai/v1/chat/completions
Authorization: Bearer $CEREBRAS_API_KEY
```

---

## Implementation Steps

### 1. Get API Key
- Sign up at [cerebras.ai](https://cerebras.ai)
- Create API key in dashboard
- Add to `.env.local`: `CEREBRAS_API_KEY=...`

### 2. Create Cerebras Client Module
Create `lib/cerebras/` mirroring `lib/groq/` structure:
```
lib/cerebras/
├── cerebras-config.ts   # Models, API key getter
├── cerebras-client.ts   # Client with retry logic
├── cerebras-client.test.ts
└── index.ts
```

Reference implementation: `lib/groq/groq-client.ts`

### 3. Update Unified AI Provider
Modify `lib/ai-provider/ai-provider.ts`:
- Primary: Cerebras (text)
- Fallback: OpenRouter (text)
- Remove Groq from text provider chain

### 4. Remove Groq Text Client
- Delete `lib/groq/` (no longer needed for text)
- Keep `convex/lib/groq.ts` (still used for vision)

### 5. Update Tests
- Add Cerebras client tests (copy pattern from `lib/groq/groq-client.test.ts`)
- Update AI provider tests

---

## Key References

| Resource | URL |
|----------|-----|
| Cerebras Docs | https://docs.cerebras.ai |
| API Reference | https://docs.cerebras.ai/api-reference |
| AI SDK Provider | https://www.npmjs.com/package/@ai-sdk/cerebras |
| Rate Limits | https://docs.cerebras.ai/rate-limits |

### AI SDK Integration
```bash
bun add @ai-sdk/cerebras
```

```typescript
import { createCerebras } from '@ai-sdk/cerebras';
import { generateText } from 'ai';

const cerebras = createCerebras({ apiKey: process.env.CEREBRAS_API_KEY });

const { text } = await generateText({
  model: cerebras('llama-3.3-70b'),
  prompt: 'Enhance this prompt...',
});
```

---

## Acceptance Criteria

- [x] Cerebras handles all text-to-text (prompt enhancement, suggestions)
- [x] Groq reserved exclusively for vision/NSFW detection
- [x] OpenRouter remains as fallback for both text and vision
- [x] All existing tests pass
- [x] New Cerebras client has full test coverage

---

## Files to Modify

| File | Action |
|------|--------|
| `lib/cerebras/*` | Create (new module) |
| `lib/ai-provider/ai-provider.ts` | Update (Cerebras primary) |
| `lib/groq/*` | Delete (text no longer needed) |
| `convex/lib/groq.ts` | Keep (vision only) |
| `convex/lib/visionAnalysis.ts` | Keep (unchanged) |

---

## Estimated Effort

~2-3 hours (straightforward port from Groq client pattern)
