# Suno Music Generation — Discovery Document

> Extracted from `C:\Code\pollinations` codebase on 2026-03-04.

---

## 1. Model Identity

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| Registry key   | `suno`                                   |
| Aliases        | `suno-v5`, `suno-music`                  |
| Resolved model | `suno-v5` (falls back to `suno-v4.5`)    |
| Provider       | `airforce` (`api.airforce`)              |
| Input Modal.   | `["text"]`                               |
| Output Modal.  | `["audio"]`                              |
| Alpha          | `true`                                   |

Source: `shared/registry/audio.ts` lines 104-120

---

## 2. API Endpoint

### OpenAI-compatible POST endpoint
```
POST https://enter.pollinations.ai/v1/audio/speech
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "model": "suno",
  "input": "<prompt text>",
  "voice": "alloy"        // ignored for Suno
}
```

### GET shorthand (gen.pollinations.ai)
```
GET https://gen.pollinations.ai/audio/<encodedPrompt>?model=suno
```

Both return **binary audio data** with `Content-Type: audio/mpeg`.

---

## 3. Upstream Implementation

The gateway (`enter.pollinations.ai/src/routes/audio.ts`) calls `generateSunoMusic()`:

1. **Request** → `POST https://api.airforce/v1/images/generations`
   ```json
   {
     "model": "suno-v5",
     "prompt": "<text>",
     "n": 1,
     "sse": true,
     "response_format": "url"
   }
   ```
2. **Response** → SSE stream parsed for a `data.url` field pointing to an MP4 file.
3. **Download** → MP4 is fetched, buffered, and served as `audio/mpeg`.
4. **Fallback** → If `suno-v5` fails, retries with `suno-v4.5`.
5. **Duration** → Parsed from the MP4 `mvhd` atom; fallback: `byteLength / 46000`.

Source: `enter.pollinations.ai/src/routes/audio.ts` lines 447-606

---

## 4. Input Constraints

| Constraint     | Value                          |
| -------------- | ------------------------------ |
| Max prompt     | 10,000 characters              |
| Min prompt     | 1 character                    |
| Duration param | **Not supported** for Suno     |
| Instrumental   | **Not supported** for Suno     |
| Voice          | **Ignored** for Suno           |

Only the `prompt` and `model` fields are meaningful.

---

## 5. Output Format

| Field        | Value                           |
| ------------ | ------------------------------- |
| Content-Type | `audio/mpeg`                    |
| Container    | MP4 (served as audio/mpeg)      |
| Typical size | ~2-5 MB per track               |
| Duration     | Variable (typically 30-120s)    |

---

## 6. Pricing

| Metric                    | Value                         |
| ------------------------- | ----------------------------- |
| Unit                      | `completionAudioSeconds`      |
| Cost                      | `$0.001` per second of output |
| Effective date            | 2026-03-02                    |

For a typical 60-second track: ~$0.06 per generation.

Source: `shared/registry/audio.ts` line 112

---

## 7. Authentication & Middleware

The Pollinations gateway applies these middleware layers in order:
1. `edgeRateLimit` — rate limiting
2. `auth({ allowApiKey: true })` — requires API key auth
3. `balance` — requires positive pollen balance
4. `resolveModel("generate.audio")` — resolves model aliases
5. `track("generate.audio")` — usage tracking

The Suno path specifically uses a separate `AIRFORCE_API_KEY` (not the ElevenLabs key).

---

## 8. Integration Approach for Pixelstream

### Option A: Direct GET endpoint (simplest)
```
GET https://gen.pollinations.ai/audio/{encodedPrompt}?model=suno
Authorization: Bearer <user-api-key>
```
Returns raw audio bytes. Simple `fetch()` + `URL.createObjectURL()`.

### Option B: OpenAI-compatible POST
```
POST https://enter.pollinations.ai/v1/audio/speech
{ "model": "suno", "input": "<prompt>" }
```
Same result, more structured.

### Recommendation
Use **Option A** (GET endpoint) for simplicity — it matches how the existing image/video generation works in Pixelstream (URL-based). The audio can be played directly in a `<audio>` element or downloaded as a file.

---

## 9. Key Differences from Image/Video Generation

| Aspect           | Image/Video                        | Audio (Suno)                       |
| ---------------- | ---------------------------------- | ---------------------------------- |
| Endpoint         | `/image/{prompt}`, `/video/{prompt}` | `/audio/{prompt}`                  |
| Response         | Image/video binary                 | Audio binary (audio/mpeg)          |
| Dimensions       | Width × Height                     | N/A                                |
| Duration param   | Video: yes                         | No (auto-determined)               |
| Seed             | Supported                          | Not supported                      |
| Reference image  | Supported                          | Not supported                      |
| Negative prompt  | Some models                        | Not supported                      |
| Aspect ratio     | Video: 16:9, 9:16                  | N/A                                |

The audio endpoint is significantly simpler — **prompt + model** are the only meaningful inputs.
