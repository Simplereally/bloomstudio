/**
 * Music Generation API Service Layer
 *
 * Handles URL construction and API interactions for music generation
 * via the Pollinations audio endpoints.
 *
 * Model routing:
 * - Suno: POST /v1/audio/speech with JSON body (OpenAI-compatible endpoint)
 * - ElevenLabs: GET /audio/{prompt}?model=elevenmusic&... (shorthand endpoint)
 *
 * @see C:\Code\pixelstream\todo\music-generation\suno-discovery.md
 */

import { API_CONFIG, getApiKey } from "@/lib/config/api.config"

// ============================================================================
// Music Provider & Model Definitions
// ============================================================================

/** Available music generation providers */
export const MUSIC_PROVIDERS = ["suno", "elevenlabs"] as const
export type MusicProvider = (typeof MUSIC_PROVIDERS)[number]

/** Available music generation models */
export const MUSIC_MODELS = ["suno-v5", "suno-v4.5", "elevenmusic"] as const
export type MusicModel = (typeof MUSIC_MODELS)[number]

/** Default provider */
export const DEFAULT_MUSIC_PROVIDER: MusicProvider = "suno"

/** Default model */
export const DEFAULT_MUSIC_MODEL: MusicModel = "suno-v5"

/** Maximum prompt length for Suno (10,000 characters) */
export const SUNO_MAX_PROMPT_LENGTH = 10_000

/** Approximate cost per second of audio output */
export const SUNO_COST_PER_SECOND = 0.001

/** Typical track duration range */
export const SUNO_DURATION_RANGE = { min: 30, max: 120 } as const

/** Duration constraints for ElevenLabs Music (seconds) */
export const ELEVENMUSIC_DURATION_RANGE = { min: 3, max: 300 } as const

/** Default duration for ElevenLabs Music (seconds) */
export const ELEVENMUSIC_DEFAULT_DURATION = 60

/** Human-readable provider metadata for UI display */
export const MUSIC_PROVIDER_META: Record<MusicProvider, {
  label: string
  description: string
  models: MusicModel[]
}> = {
  suno: {
    label: "Suno",
    description: "Full song generation with lyrics and vocals",
    models: ["suno-v5", "suno-v4.5"],
  },
  elevenlabs: {
    label: "ElevenLabs",
    description: "Instrumental and vocal tracks with precise duration control",
    models: ["elevenmusic"],
  },
} as const

/** Human-readable model metadata for UI display */
export const MUSIC_MODEL_META: Record<MusicModel, {
  label: string
  description: string
  features: string[]
}> = {
  "suno-v5": {
    label: "Suno v5",
    description: "Latest Suno model for high quality full songs",
    features: ["Lyrics", "Vocals", "Full arrangement", "High quality"],
  },
  "suno-v4.5": {
    label: "Suno v4.5",
    description: "Previous Suno model, fast and reliable",
    // NOTE: Upstream API currently treats this as an internal fallback for suno-v5.
    // Explicit selection support pending in future API update.
    features: ["Lyrics", "Vocals", "Full arrangement"],
  },
  elevenmusic: {
    label: "ElevenMusic",
    description: "Instrumental and vocal tracks with precise duration control",
    features: ["Duration control", "Instrumental mode", "High fidelity"],
  },
} as const

// ============================================================================
// Generation Parameters
// ============================================================================

export interface MusicGenerationParams {
  /** The text prompt describing the music to generate */
  prompt: string
  /** Which model to use for generation */
  model?: MusicModel
  /** Track duration in seconds (elevenmusic only, 3–300) */
  duration?: number
  /** Whether to generate an instrumental track without vocals */
  instrumental?: boolean
  /** Optional lyrics to include in the generation */
  lyrics?: string
}

export interface MusicGenerationResult {
  /** Unique ID for this generation */
  id: string
  /** The prompt used to generate the track */
  prompt: string
  /** User-editable track title (auto-derived from prompt if not set) */
  title?: string
  /**
   * Object URL for the audio blob (for playback).
   *
   * **Caller must call `URL.revokeObjectURL(audioUrl)` when the URL is no
   * longer needed** (e.g., on component unmount or after playback cleanup)
   * to release the underlying blob memory. Failing to revoke will leak
   * memory for the lifetime of the document.
   */
  audioUrl: string
  /** Raw audio blob (for download) */
  audioBlob: Blob
  /** Timestamp of generation */
  timestamp: number
  /** Estimated duration in seconds (parsed from response or estimated from size) */
  estimatedDuration: number | null
  /** The model used for generation */
  model: MusicModel
  /** Whether instrumental mode was used */
  instrumental: boolean
  /** Track lifecycle status */
  status: "generating" | "done" | "error"
  /** Error message if status is "error" */
  errorMessage?: string
  /** Lyrics used for generation (if any) */
  lyrics?: string
  /** User reaction: like/dislike/null (no reaction) */
  reaction?: "like" | "dislike" | null
  /** Convex document ID for persisted generations */
  convexId?: string
}

export class MusicAPI {
  private static readonly BASE_URL = API_CONFIG.baseUrl

  /**
   * Builds the audio generation URL for models that use the GET shorthand.
   * Currently only used for ElevenLabs: GET /audio/{encodedPrompt}?model=elevenmusic&...
   *
   * Suno uses the POST /v1/audio/speech endpoint instead (see generate()).
   */
  static buildAudioUrl(prompt: string, options?: {
    model?: MusicModel
    duration?: number
    instrumental?: boolean
  }): string {
    const model = options?.model ?? DEFAULT_MUSIC_MODEL
    const encodedPrompt = encodeURIComponent(prompt.trim())
    const params = new URLSearchParams({ model })

    if (model === "elevenmusic") {
      if (options?.duration !== undefined) {
        const clamped = Math.max(
          ELEVENMUSIC_DURATION_RANGE.min,
          Math.min(ELEVENMUSIC_DURATION_RANGE.max, Math.round(options.duration)),
        )
        params.set("duration", String(clamped))
      }
      if (options?.instrumental !== undefined) {
        params.set("instrumental", String(options.instrumental))
      }
    }

    return `${this.BASE_URL}/audio/${encodedPrompt}?${params.toString()}`
  }

  /**
   * Get request headers with optional authentication.
   * Mirrors PollinationsAPI.getHeaders().
   */
  static getHeaders(apiKey?: string): HeadersInit {
    const headers: HeadersInit = {}
    const key = apiKey ?? getApiKey()

    if (key) {
      headers["Authorization"] = `Bearer ${key}`
    }

    return headers
  }

  /**
   * Generates music from a text prompt.
   *
   * Routes to the correct Pollinations endpoint based on model:
   * - Suno: POST /v1/audio/speech (OpenAI-compatible endpoint)
   * - ElevenLabs: GET /audio/{prompt}?model=elevenmusic&... (shorthand endpoint)
   *
   * Returns a blob URL for immediate playback plus the raw blob for download.
   *
   * @throws {MusicGenerationError} If the API request fails
   */
  static async generate(
    params: MusicGenerationParams,
    signal?: AbortSignal,
    apiKey?: string,
  ): Promise<MusicGenerationResult> {
    const { prompt, model = DEFAULT_MUSIC_MODEL, duration, instrumental, lyrics } = params

    if (!prompt.trim()) {
      throw new MusicGenerationError("Prompt cannot be empty", "INVALID_INPUT")
    }

    if (prompt.length > SUNO_MAX_PROMPT_LENGTH) {
      throw new MusicGenerationError(
        `Prompt exceeds maximum length of ${SUNO_MAX_PROMPT_LENGTH} characters`,
        "INVALID_INPUT",
      )
    }

    // Build the formatted prompt when lyrics are provided.
    // Embeds lyrics into the prompt text so both Suno (POST body) and
    // ElevenLabs (GET URL) receive them.
    // Format: [Style]\n{prompt}\n\n[Lyrics]\n{lyrics}
    const trimmedLyrics = lyrics?.trim()
    const formattedPrompt = trimmedLyrics
      ? `[Style]\n${prompt.trim()}\n\n[Lyrics]\n${trimmedLyrics}`
      : prompt.trim()

    const headers = this.getHeaders(apiKey)
    let response: Response

    try {
      if (model === "suno-v5" || model === "suno-v4.5") {
        // Suno must use the POST /v1/audio/speech endpoint.
        // The GET /audio/:text route does NOT dispatch to Suno — it falls
        // through to ElevenLabs TTS. Only the POST route handles Suno.
        const url = `${this.BASE_URL}/v1/audio/speech`
        response = await fetch(url, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input: formattedPrompt,
          }),
          signal,
        })
      } else {
        // ElevenLabs uses the GET shorthand endpoint with query params
        const url = this.buildAudioUrl(formattedPrompt, { model, duration, instrumental })
        response = await fetch(url, { headers, signal })
      }
    } catch (err) {
      throw normalizeNetworkError(err, signal)
    }

    if (!response.ok) {
      const errorCode = mapHttpStatusToErrorCode(response.status)
      const body = await response.text().catch(() => "")
      throw new MusicGenerationError(
        body || `Music generation failed (${response.status})`,
        errorCode,
      )
    }

    let audioBlob: Blob
    try {
      audioBlob = await response.blob()
    } catch (err) {
      throw normalizeNetworkError(err, signal)
    }

    // NOTE: This creates a persistent object URL that holds a strong reference
    // to `audioBlob` in memory. Callers MUST call `URL.revokeObjectURL(audioUrl)`
    // when playback is complete or the owning component unmounts to avoid leaks.
    const audioUrl = URL.createObjectURL(audioBlob)

    // Estimate duration from blob size (fallback: byteLength / 46000 per discovery doc)
    const estimatedDuration = audioBlob.size > 0
      ? Math.round(audioBlob.size / 46000)
      : null

    return {
      id: crypto.randomUUID(),
      prompt: prompt.trim(),
      audioUrl,
      audioBlob,
      timestamp: Date.now(),
      estimatedDuration,
      model,
      instrumental: instrumental ?? false,
      status: "done",
      lyrics: trimmedLyrics || undefined,
    }
  }

  /**
   * Validates a prompt for music generation.
   */
  static validatePrompt(prompt: string): { valid: boolean; error?: string } {
    const trimmed = prompt.trim()
    if (!trimmed) return { valid: false, error: "Prompt is required" }
    if (trimmed.length > SUNO_MAX_PROMPT_LENGTH) {
      return { valid: false, error: `Prompt must be under ${SUNO_MAX_PROMPT_LENGTH.toLocaleString()} characters` }
    }
    return { valid: true }
  }
}

// ============================================================================
// Error Types
// ============================================================================

export type MusicErrorCode =
  | "INVALID_INPUT"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "BUDGET_EXHAUSTED"
  | "CLIENT_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "ABORTED"

export class MusicGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: MusicErrorCode,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "MusicGenerationError"
  }
}

function mapHttpStatusToErrorCode(status: number): MusicErrorCode {
  if (status === 400) return "BAD_REQUEST"
  if (status === 401 || status === 403) return "UNAUTHORIZED"
  if (status === 402) return "BUDGET_EXHAUSTED"
  if (status === 429) return "RATE_LIMITED"
  if (status >= 400 && status < 500) return "CLIENT_ERROR"
  return "SERVER_ERROR"
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Formats a duration in seconds as m:ss (e.g., 90 → "1:30").
 * Shared by MusicPlayer and MusicHistory components.
 */
export function formatMusicDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * Normalizes raw fetch/stream errors into typed MusicGenerationErrors.
 * Detects AbortError and network failures.
 */
function normalizeNetworkError(err: unknown, signal?: AbortSignal): MusicGenerationError {
  // If it's already a MusicGenerationError, pass it through
  if (err instanceof MusicGenerationError) return err

  // Detect AbortError (DOMException) or signal state
  const isAbort = signal?.aborted || (err instanceof Error && err.name === "AbortError")

  if (isAbort) {
    return new MusicGenerationError("Music generation aborted", "ABORTED", { cause: err })
  }

  // Everything else is treated as a network/system error
  const message = err instanceof Error ? err.message : String(err)
  return new MusicGenerationError(message, "NETWORK_ERROR", { cause: err })
}
