# Pollinations.AI API Endpoint Refactor

**Base URL:** `https://gen.pollinations.ai`  
**API Version:** 0.3.0  
**Documentation Source:** https://enter.pollinations.ai/api/docs

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints Overview](#endpoints-overview)
3. [GET /v1/models](#get-v1models)
4. [GET /image/models](#get-imagemodels)
5. [GET /text/models](#get-textmodels)
6. [POST /v1/chat/completions](#post-v1chatcompletions)
7. [GET /text/{prompt}](#get-textprompt)
8. [GET /image/{prompt}](#get-imageprompt)
9. [Shared Schemas](#shared-schemas)
10. [Error Responses](#error-responses)

---

## Authentication

### Key Types

| Type | Prefix | Usage | Rate Limits |
|------|--------|-------|-------------|
| **Publishable Keys** | `pk_` | Client-side safe | IP rate-limited (3 req/burst, 1/15sec refill) |
| **Secret Keys** | `sk_` | Server-side only | No rate limits, can spend Pollen |

### Auth Methods

1. **Header (Recommended):**
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

2. **Query Parameter:**
   ```
   ?key=YOUR_API_KEY
   ```

**Get API Keys:** https://enter.pollinations.ai

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/models` | Get available text models (OpenAI-compatible) |
| GET | `/image/models` | Get available image models with pricing |
| GET | `/text/models` | Get available text models with pricing |
| POST | `/v1/chat/completions` | OpenAI-compatible chat completions |
| GET | `/text/{prompt}` | Simple text generation |
| GET | `/image/{prompt}` | Image/video generation |

---

## GET /v1/models

**Operation ID:** `getGenerateV1Models`  
**Description:** Get available text models (OpenAI-compatible).

### Response Schema (200 OK)

```typescript
type Response = ModelDescription[];

interface ModelDescription {
  name: string;                                    // Required
  description: string;                             // Required
  tier: "anonymous" | "seed" | "flower" | "nectar"; // Required
  community: boolean;                              // Required
  aliases?: string[];
  input_modalities: ("text" | "image" | "audio")[]; // Required
  output_modalities: ("text" | "image" | "audio")[]; // Required
  tools: boolean;                                  // Required
  vision: boolean;                                 // Required
  audio: boolean;                                  // Required
  maxInputChars?: number;
  reasoning?: boolean;
  voices?: string[];
  uncensored?: boolean;
  supportsSystemMessages?: boolean;
}
```

### Example Response

```json
[
  {
    "name": "openai",
    "description": "OpenAI GPT model",
    "tier": "anonymous",
    "community": false,
    "aliases": ["gpt", "gpt-4"],
    "input_modalities": ["text", "image"],
    "output_modalities": ["text"],
    "tools": true,
    "vision": true,
    "audio": false,
    "reasoning": false
  }
]
```

---

## GET /image/models

**Operation ID:** `getGenerateImageModels`  
**Description:** Get a list of available image generation models with pricing, capabilities, and metadata.

### Response Schema (200 OK)

```typescript
type Response = ImageModelInfo[];

interface ImageModelInfo {
  name: string;                    // Required
  aliases: string[];               // Required
  pricing: ModelPricing;           // Required
  description?: string;
  input_modalities?: string[];
  output_modalities?: string[];
  tools?: boolean;
  reasoning?: boolean;
  context_window?: number;
  voices?: string[];
  is_specialized?: boolean;
}

interface ModelPricing {
  currency: "pollen";              // Required, always "pollen"
  input_token_price?: number;
  output_token_price?: number;
  cached_token_price?: number;
  image_price?: number;
  audio_input_price?: number;
  audio_output_price?: number;
}
```

---

## GET /text/models

**Operation ID:** `getGenerateTextModels`  
**Description:** Get a list of available text generation models with pricing, capabilities, and metadata.

### Response Schema (200 OK)

```typescript
type Response = TextModelInfo[];

interface TextModelInfo {
  name: string;                    // Required
  aliases: string[];               // Required
  pricing: ModelPricing;           // Required
  description?: string;
  input_modalities?: string[];
  output_modalities?: string[];
  tools?: boolean;
  reasoning?: boolean;
  context_window?: number;
  voices?: string[];
  is_specialized?: boolean;
}

interface ModelPricing {
  currency: "pollen";              // Required, always "pollen"
  input_token_price?: number;
  output_token_price?: number;
  cached_token_price?: number;
  image_price?: number;
  audio_input_price?: number;
  audio_output_price?: number;
}
```

---

## POST /v1/chat/completions

**Operation ID:** `postGenerateV1ChatCompletions`  
**Description:** OpenAI-compatible chat completions endpoint.  
**Legacy Endpoint:** `/openai` (deprecated)

### Request Body Schema

```typescript
interface ChatCompletionRequest {
  messages: Message[];                             // Required
  model?: string;                                  // Default: "openai"
  
  // Audio options
  modalities?: ("text" | "audio")[];
  audio?: {
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | 
           "coral" | "verse" | "ballad" | "ash" | "sage" | "amuch" | "dan";
    format: "wav" | "mp3" | "flac" | "opus" | "pcm16";
  };
  
  // Sampling parameters
  temperature?: number | null;                     // Default: 1, Range: 0-2
  top_p?: number | null;                          // Default: 1, Range: 0-1
  frequency_penalty?: number | null;              // Default: 0, Range: -2 to 2
  presence_penalty?: number | null;               // Default: 0, Range: -2 to 2
  repetition_penalty?: number | null;             // Range: 0-2
  
  // Token limits
  max_tokens?: number | null;
  
  // Reproducibility
  seed?: number | null;
  
  // Streaming
  stream?: boolean | null;                         // Default: false
  stream_options?: {
    include_usage?: boolean;
  } | null;
  
  // Response format
  response_format?: 
    | { type: "text" }
    | { type: "json_object" }
    | { 
        type: "json_schema";
        json_schema: {
          description?: string;
          name?: string;
          schema: Record<string, unknown>;
          strict?: boolean | null;                 // Default: false
        };
      };
  
  // Tool calling
  tools?: Tool[];
  tool_choice?: "none" | "auto" | "required" | {
    type: "function";
    function: { name: string };
  };
  parallel_tool_calls?: boolean;                   // Default: true
  
  // Reasoning/Thinking
  thinking?: {
    type?: "enabled" | "disabled";                 // Default: "disabled"
    budget_tokens?: number;
  } | null;
  reasoning_effort?: "low" | "medium" | "high";
  thinking_budget?: number;
  
  // Other options
  logit_bias?: Record<string, number> | null;     // Default: null
  logprobs?: boolean | null;                       // Default: false
  top_logprobs?: number | null;                    // Range: 0-20
  stop?: string | null | string[];                 // Max 4 strings
  user?: string;
  
  // Deprecated function calling
  function_call?: "none" | "auto" | { name: string };
  functions?: FunctionDefinition[];                // Max 128
}

// Message types
type Message = 
  | SystemMessage 
  | DeveloperMessage 
  | UserMessage 
  | AssistantMessage 
  | ToolMessage 
  | FunctionMessage;

interface SystemMessage {
  role: "system";
  content: string | MessageContentPart[];          // Required
  name?: string;
  cache_control?: { type: "ephemeral" };
}

interface DeveloperMessage {
  role: "developer";
  content: string | MessageContentPart[];          // Required
  name?: string;
  cache_control?: { type: "ephemeral" };
}

interface UserMessage {
  role: "user";
  content: string | MessageContentPart[];          // Required
  name?: string;
}

interface AssistantMessage {
  role: "assistant";
  content?: string | MessageContentPart[] | null;
  name?: string;
  tool_calls?: ToolCall[];
  function_call?: { arguments: string; name: string } | null;
  cache_control?: { type: "ephemeral" };
}

interface ToolMessage {
  role: "tool";
  content: string | MessageContentPart[] | null;   // Required
  tool_call_id: string;                            // Required
  cache_control?: { type: "ephemeral" };
}

interface FunctionMessage {
  role: "function";
  content: string | null;                          // Required
  name: string;                                    // Required
}

// Content parts for multimodal messages
type MessageContentPart = 
  | TextContentPart 
  | ImageUrlContentPart 
  | VideoUrlContentPart 
  | InputAudioContentPart 
  | FileContentPart;

interface TextContentPart {
  type: "text";
  text: string;                                    // Required
  cache_control?: { type: "ephemeral" };
}

interface ImageUrlContentPart {
  type: "image_url";
  image_url: {
    url: string;                                   // Required
    detail?: "auto" | "low" | "high";
    mime_type?: string;
  };
}

interface VideoUrlContentPart {
  type: "video_url";
  video_url: {
    url: string;                                   // Required
    mime_type?: string;
  };
}

interface InputAudioContentPart {
  type: "input_audio";
  input_audio: {
    data: string;                                  // Required (base64)
    format: "wav" | "mp3" | "flac" | "opus" | "pcm16"; // Required
  };
  cache_control?: { type: "ephemeral" };
}

interface FileContentPart {
  type: "file";
  file: {
    file_data?: string;
    file_id?: string;
    file_name?: string;
    file_url?: string;
    mime_type?: string;
  };
  cache_control?: { type: "ephemeral" };
}

// Tool types
type Tool = FunctionTool | BuiltInTool;

interface FunctionTool {
  type: "function";
  function: {
    name: string;                                  // Required
    description?: string;
    parameters?: Record<string, unknown>;
    strict?: boolean | null;                       // Default: false
  };
}

interface BuiltInTool {
  type: "code_execution" | "google_search" | "google_maps" | 
        "url_context" | "computer_use" | "file_search";
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}
```

### Response Schema (200 OK)

```typescript
interface ChatCompletionResponse {
  id: string;                                      // Required
  object: "chat.completion";                       // Required
  created: number;                                 // Required (Unix timestamp)
  model: string;                                   // Required
  choices: Choice[];                               // Required
  usage: CompletionUsage;                          // Required
  system_fingerprint?: string | null;
  user_tier?: "anonymous" | "seed" | "flower" | "nectar";
  citations?: string[];
  prompt_filter_results?: PromptFilterResult[] | null;
}

interface Choice {
  index: number;
  finish_reason: string | null;
  message: ResponseMessage;
  logprobs?: LogProbs | null;
  content_filter_results?: ContentFilterResult | null;
}

interface ResponseMessage {
  role: "assistant";                               // Required
  content?: string | null;
  tool_calls?: ToolCall[] | null;
  function_call?: { arguments: string; name: string } | null;
  content_blocks?: ContentBlock[] | null;
  audio?: {
    transcript: string;
    data: string;
    id?: string;
    expires_at?: number;
  } | null;
  reasoning_content?: string | null;
}

type ContentBlock = 
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "thinking"; thinking: string }
  | { type: "redacted_thinking"; data: string };

interface CompletionUsage {
  prompt_tokens: number;                           // Required
  completion_tokens: number;                       // Required
  total_tokens: number;                            // Required
  prompt_tokens_details?: {
    audio_tokens?: number;
    cached_tokens?: number;
  } | null;
  completion_tokens_details?: {
    accepted_prediction_tokens?: number;
    audio_tokens?: number;
    reasoning_tokens?: number;
    rejected_prediction_tokens?: number;
  } | null;
}
```

### Example Request

```bash
curl 'https://gen.pollinations.ai/v1/chat/completions' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openai",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

### Vision Example (Image Input)

```bash
curl 'https://gen.pollinations.ai/v1/chat/completions' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openai",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Describe this image"},
        {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
      ]
    }]
  }'
```

### Streaming Example

```bash
curl 'https://gen.pollinations.ai/v1/chat/completions' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openai",
    "messages": [{"role": "user", "content": "Write a poem"}],
    "stream": true
  }' \
  --no-buffer
```

---

## GET /text/{prompt}

**Operation ID:** `getGenerateText:prompt`  
**Description:** Generates text from text prompts.

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `prompt` | string | Yes | Text prompt for generation (min length: 1) |

### Query Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `model` | string | `"openai"` | Text model to use |
| `seed` | integer | - | Random seed for reproducible results |
| `system` | string | - | System prompt to set context/behavior |
| `json` | boolean | `false` | Return response in JSON format |
| `temperature` | number | - | Controls creativity (0.0=strict, 2.0=creative) |
| `stream` | boolean | `false` | Stream response in real-time chunks |
| `private` | boolean | `false` | Hide from public feeds |

### Available Models

```typescript
type TextModel = 
  | "openai"           // Default
  | "openai-fast"
  | "openai-large"
  | "qwen-coder"
  | "mistral"
  | "openai-audio"
  | "gemini"
  | "gemini-fast"
  | "deepseek"
  | "grok"
  | "gemini-search"
  | "chickytutor"
  | "midijourney"
  | "claude-fast"
  | "claude"
  | "claude-large"
  | "perplexity-fast"
  | "perplexity-reasoning"
  | "kimi-k2-thinking"
  | "gemini-large"
  | "nova-micro";
```

### Response (200 OK)

- **Content-Type:** `text/plain`
- **Body:** Generated text string

### Example Request

```bash
curl 'https://gen.pollinations.ai/text/Write%20a%20haiku%20about%20coding?model=openai&key=YOUR_API_KEY'
```

---

## GET /image/{prompt}

**Operation ID:** `getGenerateImage:prompt`  
**Description:** Generate an image or video from a text prompt.

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the image/video (min length: 1) |

### Query Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `model` | string | `"flux"` | AI model to use (see models below) |
| `width` | integer | `1024` | Image width in pixels |
| `height` | integer | `1024` | Image height in pixels |
| `seed` | integer | `42` | Random seed (0 to 1844674407370955) |
| `enhance` | boolean | `false` | Let AI improve your prompt |
| `negative_prompt` | string | `"worst quality, blurry"` | What to avoid in generation |
| `private` | boolean | `false` | Hide from public feeds |
| `nologo` | boolean | `false` | Remove Pollinations watermark |
| `nofeed` | boolean | `false` | Don't add to public feed |
| `safe` | boolean | `false` | Enable safety content filters |
| `quality` | string | `"medium"` | Quality level: `"low"`, `"medium"`, `"high"`, `"hd"` |
| `image` | string | - | Reference image URL(s), comma/pipe separated |
| `transparent` | boolean | `false` | Generate with transparent background |
| `guidance_scale` | number | - | How closely to follow prompt (1-20) |
| `duration` | integer | - | Video duration (veo: 4,6,8 / seedance: 2-10) |
| `aspectRatio` | string | - | Video aspect ratio: `"16:9"` or `"9:16"` |
| `audio` | boolean | `false` | Enable audio for video (veo only) |

### Available Models

```typescript
// Image Models
type ImageModel = 
  | "flux"           // Default
  | "turbo"
  | "gptimage"
  | "kontext"
  | "seedream"
  | "seedream-pro"
  | "nanobanana"
  | "nanobanana-pro"
  | "zimage";

// Video Models
type VideoModel = 
  | "veo"            // Text-to-video only (4-8 seconds)
  | "seedance"       // Text-to-video and image-to-video (2-10 seconds)
  | "seedance-pro";
```

### Response (200 OK)

- **Content-Type:** 
  - `image/jpeg` - JPEG image
  - `image/png` - PNG image (when transparent=true)
  - `video/mp4` - MP4 video (when using video models)
- **Body:** Binary image/video data

### Example Requests

**Basic Image:**
```bash
curl 'https://gen.pollinations.ai/image/a%20beautiful%20sunset%20over%20mountains?model=flux' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -o output.jpg
```

**Custom Dimensions:**
```bash
curl 'https://gen.pollinations.ai/image/a%20cat?model=flux&width=1920&height=1080&quality=high' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -o output.jpg
```

**With Negative Prompt:**
```bash
curl 'https://gen.pollinations.ai/image/portrait%20of%20a%20woman?negative_prompt=ugly,blurry,distorted' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -o output.jpg
```

**Image-to-Image (with reference):**
```bash
curl 'https://gen.pollinations.ai/image/make%20it%20cyberpunk?model=kontext&image=https://example.com/photo.jpg' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -o output.jpg
```

**Video Generation:**
```bash
curl 'https://gen.pollinations.ai/image/a%20bird%20flying?model=veo&duration=6' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -o output.mp4
```

---

## Shared Schemas

### ContentFilterResult

```typescript
interface ContentFilterResult {
  hate?: {
    filtered: boolean;
    severity: "safe" | "low" | "medium" | "high";
  };
  self_harm?: {
    filtered: boolean;
    severity: "safe" | "low" | "medium" | "high";
  };
  sexual?: {
    filtered: boolean;
    severity: "safe" | "low" | "medium" | "high";
  };
  violence?: {
    filtered: boolean;
    severity: "safe" | "low" | "medium" | "high";
  };
  jailbreak?: {
    filtered: boolean;
    detected: boolean;
  };
  protected_material_text?: {
    filtered: boolean;
    detected: boolean;
  };
  protected_material_code?: {
    filtered: boolean;
    detected: boolean;
  };
}
```

### CacheControl

```typescript
interface CacheControl {
  type: "ephemeral";
}
```

---

## Error Responses

### 400 Bad Request

```typescript
interface BadRequestError {
  status: 400;
  success: false;
  error: {
    code: "BAD_REQUEST";
    message: string;
    timestamp: string;
    details: ValidationErrorDetails;
    requestId?: string;
    cause?: unknown;
  };
}

interface ValidationErrorDetails {
  name: string;
  stack?: string;
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}
```

### 401 Unauthorized

```typescript
interface UnauthorizedError {
  status: 401;
  success: false;
  error: {
    code: "UNAUTHORIZED";
    message: string;
    timestamp: string;
    details: ErrorDetails;
    requestId?: string;
    cause?: unknown;
  };
}
```

### 500 Internal Server Error

```typescript
interface InternalError {
  status: 500;
  success: false;
  error: {
    code: "INTERNAL_ERROR";
    message: string;
    timestamp: string;
    details: ErrorDetails;
    requestId?: string;
    cause?: unknown;
  };
}

interface ErrorDetails {
  name: string;
  stack?: string;
}
```

---

## Quick Reference

### Image Generation (Most Common Use Case)

```typescript
// TypeScript interface for image generation parameters
interface ImageGenerationParams {
  prompt: string;           // Required - URL encoded in path
  model?: string;           // Default: "flux"
  width?: number;           // Default: 1024
  height?: number;          // Default: 1024
  seed?: number;            // Default: 42
  enhance?: boolean;        // Default: false
  negative_prompt?: string; // Default: "worst quality, blurry"
  nologo?: boolean;         // Default: false
  quality?: "low" | "medium" | "high" | "hd"; // Default: "medium"
  guidance_scale?: number;  // Range: 1-20
  transparent?: boolean;    // Default: false
  safe?: boolean;           // Default: false
  private?: boolean;        // Default: false
}

// Example URL construction
function buildImageUrl(params: ImageGenerationParams): string {
  const base = "https://gen.pollinations.ai/image";
  const prompt = encodeURIComponent(params.prompt);
  const query = new URLSearchParams();
  
  if (params.model) query.set("model", params.model);
  if (params.width) query.set("width", params.width.toString());
  if (params.height) query.set("height", params.height.toString());
  if (params.seed !== undefined) query.set("seed", params.seed.toString());
  if (params.enhance) query.set("enhance", "true");
  if (params.negative_prompt) query.set("negative_prompt", params.negative_prompt);
  if (params.nologo) query.set("nologo", "true");
  if (params.quality) query.set("quality", params.quality);
  if (params.guidance_scale) query.set("guidance_scale", params.guidance_scale.toString());
  if (params.transparent) query.set("transparent", "true");
  if (params.safe) query.set("safe", "true");
  if (params.private) query.set("private", "true");
  
  return `${base}/${prompt}?${query.toString()}`;
}
```

### Model Discovery

```bash
# Check available image models
curl https://gen.pollinations.ai/image/models

# Check available text models
curl https://gen.pollinations.ai/v1/models
curl https://gen.pollinations.ai/text/models
```

---

## Notes for Refactoring

1. **Base URL Change:** Switch from `image.pollinations.ai` to `gen.pollinations.ai`
2. **Authentication Required:** Most endpoints now require API key authentication
3. **New Parameters:**
   - `quality` parameter for image quality control
   - `transparent` for transparent backgrounds
   - `guidance_scale` for prompt adherence
   - Video support with `duration`, `aspectRatio`, `audio`
4. **Removed/Changed Parameters:** Verify current implementation against this spec
5. **OpenAI Compatibility:** The `/v1/chat/completions` endpoint is fully OpenAI-compatible
6. **Gemini Default Tools:** The `gemini` model has `code_execution`, `google_search`, `url_context` tools enabled by default
7. **Data Fetching:** Use TanStack Query hooks (`useGenerateImage`, `useDownloadImage`) for API calls
