import { beforeEach, describe, expect, it, vi } from "vitest"
import * as apiConfig from "./config/api.config"
import {
  MusicAPI,
  MusicGenerationError,
  SUNO_MAX_PROMPT_LENGTH,
  SUNO_MODEL,
  MUSIC_MODELS,
  DEFAULT_MUSIC_MODEL,
  ELEVENMUSIC_DURATION_RANGE,
  ELEVENMUSIC_DEFAULT_DURATION,
  MUSIC_MODEL_META,
  type MusicErrorCode,
  type MusicModel,
} from "./music-api"

describe("MusicAPI", () => {
  describe("buildAudioUrl", () => {
    it("uses the correct base URL and /audio/ path", () => {
      const url = MusicAPI.buildAudioUrl("test prompt")
      expect(url).toContain("https://gen.pollinations.ai/audio/")
    })

    it("encodes the prompt in the URL path", () => {
      const url = MusicAPI.buildAudioUrl("a chill lo-fi beat")
      expect(url).toContain("/audio/a%20chill%20lo-fi%20beat")
    })

    it("encodes special characters in the prompt", () => {
      const url = MusicAPI.buildAudioUrl("jazz & blues")
      expect(url).toContain("/audio/jazz%20%26%20blues")
    })

    it("trims whitespace from the prompt before encoding", () => {
      const url = MusicAPI.buildAudioUrl("  spaced out  ")
      expect(url).toContain("/audio/spaced%20out")
    })

    it("defaults to suno model when no options provided", () => {
      const url = MusicAPI.buildAudioUrl("test")
      expect(url).toContain("model=suno-v5")
    })

    it("uses the specified model", () => {
      const url = MusicAPI.buildAudioUrl("test", { model: "elevenmusic" })
      expect(url).toContain("model=elevenmusic")
    })

    it("includes duration for elevenmusic", () => {
      const url = MusicAPI.buildAudioUrl("test", { model: "elevenmusic", duration: 120 })
      expect(url).toContain("duration=120")
    })

    it("includes instrumental flag for elevenmusic", () => {
      const url = MusicAPI.buildAudioUrl("test", { model: "elevenmusic", instrumental: true })
      expect(url).toContain("instrumental=true")
    })

    it("does not include duration/instrumental for suno model", () => {
      const url = MusicAPI.buildAudioUrl("test", { model: "suno-v5", duration: 120, instrumental: true })
      expect(url).not.toContain("duration=")
      expect(url).not.toContain("instrumental=")
    })

    it("clamps duration to min range for elevenmusic", () => {
      const url = MusicAPI.buildAudioUrl("test", { model: "elevenmusic", duration: 1 })
      expect(url).toContain(`duration=${ELEVENMUSIC_DURATION_RANGE.min}`)
    })

    it("clamps duration to max range for elevenmusic", () => {
      const url = MusicAPI.buildAudioUrl("test", { model: "elevenmusic", duration: 999 })
      expect(url).toContain(`duration=${ELEVENMUSIC_DURATION_RANGE.max}`)
    })
  })

  describe("getHeaders", () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it("returns empty headers when no API key is configured", () => {
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)
      const headers = MusicAPI.getHeaders()
      expect(headers).toEqual({})
    })

    it("returns Authorization header when API key is present", () => {
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue("test-music-key")
      const headers = MusicAPI.getHeaders()
      expect(headers).toEqual({
        Authorization: "Bearer test-music-key",
      })
    })

    it("prefers explicit apiKey parameter over env var", () => {
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue("env-key")
      const headers = MusicAPI.getHeaders("explicit-key")
      expect(headers).toEqual({
        Authorization: "Bearer explicit-key",
      })
    })

    it("falls back to env var when no explicit apiKey is passed", () => {
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue("env-key")
      const headers = MusicAPI.getHeaders()
      expect(headers).toEqual({
        Authorization: "Bearer env-key",
      })
    })
  })

  describe("validatePrompt", () => {
    it("returns valid for a non-empty prompt", () => {
      expect(MusicAPI.validatePrompt("a jazz track")).toEqual({ valid: true })
    })

    it("returns invalid for an empty string", () => {
      const result = MusicAPI.validatePrompt("")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Prompt is required")
    })

    it("returns invalid for a whitespace-only string", () => {
      const result = MusicAPI.validatePrompt("   ")
      expect(result.valid).toBe(false)
      expect(result.error).toBe("Prompt is required")
    })

    it("returns invalid when prompt exceeds max length", () => {
      const longPrompt = "a".repeat(SUNO_MAX_PROMPT_LENGTH + 1)
      const result = MusicAPI.validatePrompt(longPrompt)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("under")
      expect(result.error).toContain(SUNO_MAX_PROMPT_LENGTH.toLocaleString())
    })

    it("returns valid for a prompt exactly at max length", () => {
      const maxPrompt = "a".repeat(SUNO_MAX_PROMPT_LENGTH)
      expect(MusicAPI.validatePrompt(maxPrompt)).toEqual({ valid: true })
    })
  })

  describe("generate", () => {
    beforeEach(() => {
      vi.restoreAllMocks()
      // Mock crypto.randomUUID
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "test-uuid-1234-5678-9abc-def012345678" as `${string}-${string}-${string}-${string}-${string}`,
      )
    })

    it("throws MusicGenerationError for empty prompt", async () => {
      await expect(MusicAPI.generate({ prompt: "" })).rejects.toThrow(
        MusicGenerationError,
      )
      await expect(MusicAPI.generate({ prompt: "   " })).rejects.toThrow(
        MusicGenerationError,
      )
    })

    it("throws with INVALID_INPUT code for empty prompt", async () => {
      try {
        await MusicAPI.generate({ prompt: "" })
        expect.fail("Should have thrown")
      } catch (err) {
        expect(err).toBeInstanceOf(MusicGenerationError)
        expect((err as MusicGenerationError).code).toBe("INVALID_INPUT")
      }
    })

    it("throws for prompts exceeding max length", async () => {
      const longPrompt = "a".repeat(SUNO_MAX_PROMPT_LENGTH + 1)
      try {
        await MusicAPI.generate({ prompt: longPrompt })
        expect.fail("Should have thrown")
      } catch (err) {
        expect(err).toBeInstanceOf(MusicGenerationError)
        expect((err as MusicGenerationError).code).toBe("INVALID_INPUT")
      }
    })

    it("returns a MusicGenerationResult on successful fetch", async () => {
      const mockBlob = new Blob(["fake audio data"], { type: "audio/mpeg" })
      const mockResponse = new Response(mockBlob, { status: 200 })

      vi.spyOn(global, "fetch").mockResolvedValue(mockResponse)
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const result = await MusicAPI.generate({ prompt: "chill vibes" })

      expect(result.id).toBe("test-uuid-1234-5678-9abc-def012345678")
      expect(result.prompt).toBe("chill vibes")
      expect(result.audioBlob).toBeInstanceOf(Blob)
      expect(result.audioUrl).toMatch(/^blob:/)
      expect(result.timestamp).toBeTypeOf("number")
      expect(result.estimatedDuration).toBeTypeOf("number")
      expect(result.model).toBe(DEFAULT_MUSIC_MODEL)
      expect(result.instrumental).toBe(false)
    })

    it("sends a POST to /v1/audio/speech for default (suno) model", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      await MusicAPI.generate({ prompt: "test prompt" })

      expect(fetchSpy).toHaveBeenCalledOnce()
      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toBe("https://gen.pollinations.ai/v1/audio/speech")
      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      expect(calledOptions.method).toBe("POST")
      expect(calledOptions.body).toBe(JSON.stringify({ model: "suno", input: "test prompt" }))
    })

    it("sends elevenmusic params when model is elevenmusic", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      await MusicAPI.generate({
        prompt: "test",
        model: "elevenmusic",
        duration: 120,
        instrumental: true,
      })

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain("model=elevenmusic")
      expect(calledUrl).toContain("duration=120")
      expect(calledUrl).toContain("instrumental=true")
    })

    it("returns the correct model and instrumental fields in result", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const result = await MusicAPI.generate({
        prompt: "test",
        model: "elevenmusic",
        instrumental: true,
      })

      expect(result.model).toBe("elevenmusic")
      expect(result.instrumental).toBe(true)
    })

    it("includes authorization header when API key is set (elevenmusic GET)", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue("my-key")

      await MusicAPI.generate({ prompt: "test", model: "elevenmusic" })

      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      expect(calledOptions.headers).toEqual({
        Authorization: "Bearer my-key",
      })
    })

    it("includes authorization and content-type headers for suno POST", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue("my-key")

      await MusicAPI.generate({ prompt: "test", model: "suno-v5" })

      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      // getHeaders() returns base headers; Suno POST branch spreads them + adds Content-Type
      expect(calledOptions.headers).toEqual({
        Authorization: "Bearer my-key",
        "Content-Type": "application/json",
      })
    })

    it("uses explicit apiKey parameter over env var in generate()", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue("env-key")

      await MusicAPI.generate({ prompt: "test", model: "elevenmusic" }, undefined, "user-key")

      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      expect(calledOptions.headers).toEqual({
        Authorization: "Bearer user-key",
      })
    })

    it("uses explicit apiKey in default model (suno-v5) POST headers", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      await MusicAPI.generate({ prompt: "test" }, undefined, "user-key")

      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      // Default model is suno-v5 which uses POST, so Content-Type is included
      expect(calledOptions.headers).toEqual({
        Authorization: "Bearer user-key",
        "Content-Type": "application/json",
      })
    })

    it("passes the abort signal to fetch (elevenmusic GET)", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const controller = new AbortController()
      await MusicAPI.generate({ prompt: "test", model: "elevenmusic" }, controller.signal)

      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      expect(calledOptions.signal).toBe(controller.signal)
    })

    it("passes the abort signal to fetch (suno POST)", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const controller = new AbortController()
      await MusicAPI.generate({ prompt: "test", model: "suno-v5" }, controller.signal)

      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
      expect(calledOptions.signal).toBe(controller.signal)
    })

    it("trims the prompt in the result", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const result = await MusicAPI.generate({ prompt: "  spaced  " })
      expect(result.prompt).toBe("spaced")
    })

    it("estimates duration from blob size using byteLength / 46000 formula", async () => {
      // The generate method computes: Math.round(audioBlob.size / 46000)
      // A blob with size > 0 should produce a numeric estimate.
      const mockBlob = new Blob(["fake audio data"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const result = await MusicAPI.generate({ prompt: "test" })
      // The exact value depends on blob size, but it should be a number (not null)
      expect(result.estimatedDuration).toBeTypeOf("number")
      expect(result.estimatedDuration).toBeGreaterThanOrEqual(0)
    })

    it("returns null estimatedDuration when blob size is 0", async () => {
      // Directly test the formula: size=0 → null
      // We mock fetch to return a Response whose blob() resolves to a 0-size blob
      const emptyBlob = new Blob([], { type: "audio/mpeg" })
      const mockResponse = {
        ok: true,
        status: 200,
        blob: () => Promise.resolve(emptyBlob),
        text: () => Promise.resolve(""),
      } as unknown as Response
      vi.spyOn(global, "fetch").mockResolvedValue(mockResponse)
      vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)

      const result = await MusicAPI.generate({ prompt: "test" })
      expect(result.estimatedDuration).toBeNull()
    })

    describe("HTTP error handling", () => {
      beforeEach(() => {
        vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)
      })

      it.each([
        [401, "UNAUTHORIZED"],
        [403, "UNAUTHORIZED"],
        [429, "RATE_LIMITED"],
        [402, "BUDGET_EXHAUSTED"],
        [500, "SERVER_ERROR"],
        [502, "SERVER_ERROR"],
        [503, "SERVER_ERROR"],
      ] as const)(
        "maps HTTP %i to error code %s",
        async (status, expectedCode) => {
          vi.spyOn(global, "fetch").mockResolvedValue(
            new Response("error body", { status }),
          )

          try {
            await MusicAPI.generate({ prompt: "test" })
            expect.fail("Should have thrown")
          } catch (err) {
            expect(err).toBeInstanceOf(MusicGenerationError)
            expect((err as MusicGenerationError).code).toBe(expectedCode)
          }
        },
      )

      it("includes response body text in error message when available", async () => {
        vi.spyOn(global, "fetch").mockResolvedValue(
          new Response("Rate limit exceeded", { status: 429 }),
        )

        try {
          await MusicAPI.generate({ prompt: "test" })
          expect.fail("Should have thrown")
        } catch (err) {
          expect((err as MusicGenerationError).message).toBe(
            "Rate limit exceeded",
          )
        }
      })

      it("falls back to generic message when response body is empty", async () => {
        vi.spyOn(global, "fetch").mockResolvedValue(
          new Response("", { status: 500 }),
        )

        try {
          await MusicAPI.generate({ prompt: "test" })
          expect.fail("Should have thrown")
        } catch (err) {
          expect((err as MusicGenerationError).message).toContain("500")
        }
      })
    })

    describe("lyrics formatting", () => {
      beforeEach(() => {
        vi.spyOn(apiConfig, "getApiKey").mockReturnValue(undefined)
      })

      it("formats prompt with [Style] and [Lyrics] sections when lyrics are provided", async () => {
        const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
        const fetchSpy = vi
          .spyOn(global, "fetch")
          .mockResolvedValue(new Response(mockBlob, { status: 200 }))

        await MusicAPI.generate({
          prompt: "upbeat pop",
          lyrics: "La la la\nHey hey hey",
        })

        const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
        const body = JSON.parse(calledOptions.body as string)
        expect(body.input).toBe("[Style]\nupbeat pop\n\n[Lyrics]\nLa la la\nHey hey hey")
      })

      it("sends plain prompt when no lyrics are provided", async () => {
        const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
        const fetchSpy = vi
          .spyOn(global, "fetch")
          .mockResolvedValue(new Response(mockBlob, { status: 200 }))

        await MusicAPI.generate({ prompt: "ambient drone" })

        const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
        const body = JSON.parse(calledOptions.body as string)
        expect(body.input).toBe("ambient drone")
      })

      it("ignores whitespace-only lyrics", async () => {
        const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
        const fetchSpy = vi
          .spyOn(global, "fetch")
          .mockResolvedValue(new Response(mockBlob, { status: 200 }))

        await MusicAPI.generate({ prompt: "rock anthem", lyrics: "   " })

        const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
        const body = JSON.parse(calledOptions.body as string)
        expect(body.input).toBe("rock anthem")
      })

      it("trims lyrics before formatting", async () => {
        const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
        const fetchSpy = vi
          .spyOn(global, "fetch")
          .mockResolvedValue(new Response(mockBlob, { status: 200 }))

        await MusicAPI.generate({
          prompt: "ballad",
          lyrics: "  Hello world  ",
        })

        const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit
        const body = JSON.parse(calledOptions.body as string)
        expect(body.input).toBe("[Style]\nballad\n\n[Lyrics]\nHello world")
      })

      it("includes lyrics in the returned result", async () => {
        const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
        vi.spyOn(global, "fetch").mockResolvedValue(
          new Response(mockBlob, { status: 200 }),
        )

        const result = await MusicAPI.generate({
          prompt: "pop song",
          lyrics: "Verse one lyrics here",
        })

        expect(result.lyrics).toBe("Verse one lyrics here")
      })

      it("returns undefined lyrics when none provided", async () => {
        const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
        vi.spyOn(global, "fetch").mockResolvedValue(
          new Response(mockBlob, { status: 200 }),
        )

        const result = await MusicAPI.generate({ prompt: "jazz" })

        expect(result.lyrics).toBeUndefined()
      })
    })
  })
})

describe("MusicGenerationError", () => {
  it("has the correct name", () => {
    const error = new MusicGenerationError("test", "NETWORK_ERROR")
    expect(error.name).toBe("MusicGenerationError")
  })

  it("exposes the error code", () => {
    const error = new MusicGenerationError("test", "RATE_LIMITED")
    expect(error.code).toBe("RATE_LIMITED")
  })

  it("extends Error", () => {
    const error = new MusicGenerationError("test", "SERVER_ERROR")
    expect(error).toBeInstanceOf(Error)
  })

  it("preserves the message", () => {
    const error = new MusicGenerationError("something broke", "SERVER_ERROR")
    expect(error.message).toBe("something broke")
  })
})
