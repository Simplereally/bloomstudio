import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useMusicGeneration } from "./use-music-generation"
import { MusicGenerationError, DEFAULT_MUSIC_MODEL } from "@/lib/music-api"
import type { MusicGenerationResult } from "@/lib/music-api"
import { useMutation, useQuery } from "convex/react"
import type { ReactMutation } from "convex/react"
import type { FunctionReference } from "convex/server"

// Mock pollen-auth hooks — the hook now requires a user API key from BYOP context.
// We mock at the module boundary so the hook gets a known key without needing a full provider.
const mockAuthorize = vi.fn()
const mockApiKey: { current: string | null } = { current: "test-pollen-api-key" }

vi.mock("@/lib/pollen-auth", () => ({
  usePollenApiKey: () => mockApiKey.current,
  usePollenAuthActions: () => ({ authorize: mockAuthorize }),
}))

// Mock the Convex API import — the generated module doesn't exist in test.
vi.mock("@/convex/_generated/api", () => ({
  api: {
    musicGenerations: {
      create: "musicGenerations:create",
      setReaction: "musicGenerations:setReaction",
      listByOwner: "musicGenerations:listByOwner",
    },
  },
}))

// Convenience alias for the generic ReactMutation type used in mock wiring
type AnyReactMutation = ReactMutation<FunctionReference<"mutation">>

/**
 * Build a mock that satisfies the ReactMutation interface: a callable function
 * with a `withOptimisticUpdate` method. Using Object.assign lets TypeScript
 * verify the shape structurally without double-casts.
 *
 * Returns both the typed mutation (for use in setupConvexMocks) and the
 * underlying vi.fn() (for clearing/resetting in beforeEach).
 */
function createMockMutation(
  impl: (...args: unknown[]) => Promise<unknown>,
) {
  const fn = vi.fn(impl)
  const mutation = Object.assign(fn, {
    withOptimisticUpdate: vi.fn(() => fn),
  }) as unknown as AnyReactMutation
  return { mutation, fn }
}

const mockCreate = createMockMutation(() => Promise.resolve("mock-convex-id"))
const mockReaction = createMockMutation(() => Promise.resolve({ reaction: null }))

function setupConvexMocks() {
  vi.mocked(useMutation).mockImplementation((ref: unknown) => {
    if (ref === "musicGenerations:setReaction") {
      return mockReaction.mutation
    }
    return mockCreate.mutation
  })
  vi.mocked(useQuery).mockReturnValue(undefined)
}

// We test the real hook with the real MusicAPI, mocking only at the
// system boundary (fetch) per the testing skill guidelines.
function createMockResult(overrides: Partial<MusicGenerationResult> = {}): MusicGenerationResult {
  return {
    id: crypto.randomUUID(),
    prompt: "test prompt",
    audioUrl: "blob:http://localhost/test-audio",
    audioBlob: new Blob(["audio"], { type: "audio/mpeg" }),
    timestamp: Date.now(),
    estimatedDuration: 60,
    model: DEFAULT_MUSIC_MODEL,
    instrumental: false,
    status: "done",
    ...overrides,
  }
}

describe("useMusicGeneration", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Re-apply the Convex mocks after restoreAllMocks clears them
    setupConvexMocks()
    // Reset to a valid API key for most tests
    mockApiKey.current = "test-pollen-api-key"
    mockAuthorize.mockReset()
    mockCreate.fn.mockClear()
    mockReaction.fn.mockClear()
    // Restore default resolved value (restoreAllMocks clears implementations)
    mockCreate.fn.mockImplementation(() => Promise.resolve("mock-convex-id"))
    mockReaction.fn.mockImplementation(() => Promise.resolve({ reaction: null }))
  })

  describe("initial state", () => {
    it("starts in idle status", () => {
      const { result } = renderHook(() => useMusicGeneration())

      expect(result.current.status).toBe("idle")
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.currentTrack).toBeNull()
      expect(result.current.tracks).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.errorCode).toBeNull()
    })
  })

  describe("authorization", () => {
    it("sets UNAUTHORIZED error and calls authorize() when no API key", async () => {
      mockApiKey.current = null
      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("a chill beat")
      })

      expect(result.current.status).toBe("error")
      expect(result.current.error).toBe(
        "Not connected to Pollinations. Please connect to Pollinations first."
      )
      expect(result.current.errorCode).toBe("UNAUTHORIZED")
      expect(result.current.isGenerating).toBe(false)
      expect(mockAuthorize).toHaveBeenCalledOnce()
    })

    it("does not call fetch when no API key is available", async () => {
      mockApiKey.current = null
      const fetchSpy = vi.spyOn(global, "fetch")
      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("proceeds with generation when API key is available", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("epic orchestral")
      })

      expect(result.current.status).toBe("success")
      expect(result.current.currentTrack).not.toBeNull()
      expect(mockAuthorize).not.toHaveBeenCalled()
    })
  })

  describe("generate", () => {
    it("sets status to error for an empty prompt", async () => {
      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("")
      })

      expect(result.current.status).toBe("error")
      expect(result.current.error).toBe("Prompt is required")
      expect(result.current.errorCode).toBe("INVALID_INPUT")
      expect(result.current.isGenerating).toBe(false)
    })

    it("sets status to error for whitespace-only prompt", async () => {
      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("   ")
      })

      expect(result.current.status).toBe("error")
      expect(result.current.errorCode).toBe("INVALID_INPUT")
    })

    it("transitions to generating state when API is called", async () => {
      // Use a deferred fetch so we can observe the intermediate state
      let resolveFetch!: (value: Response) => void
      vi.spyOn(global, "fetch").mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      // Start generating (don't await — we want to observe intermediate state)
      let generatePromise: Promise<void>
      act(() => {
        generatePromise = result.current.generate("chill vibes")
      })

      // Should be in generating state now
      expect(result.current.status).toBe("generating")
      expect(result.current.isGenerating).toBe(true)
      expect(result.current.error).toBeNull()

      // Resolve the fetch
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      await act(async () => {
        resolveFetch(new Response(mockBlob, { status: 200 }))
        await generatePromise!
      })

      expect(result.current.status).toBe("success")
      expect(result.current.isGenerating).toBe(false)
    })

    it("stores the generated track as currentTrack and in tracks array", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("epic orchestral")
      })

      expect(result.current.currentTrack).not.toBeNull()
      expect(result.current.currentTrack!.prompt).toBe("epic orchestral")
      expect(result.current.tracks).toHaveLength(1)
      expect(result.current.tracks[0]).toBe(result.current.currentTrack)
    })

    it("prepends new tracks to the tracks array (newest first)", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("first track")
      })

      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(new Blob(["audio2"]), { status: 200 }),
      )

      await act(async () => {
        await result.current.generate("second track")
      })

      expect(result.current.tracks).toHaveLength(2)
      expect(result.current.tracks[0].prompt).toBe("second track")
      expect(result.current.tracks[1].prompt).toBe("first track")
    })

    it("sets error state when API returns an HTTP error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response("Rate limited", { status: 429 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })

      expect(result.current.status).toBe("error")
      expect(result.current.error).toBe("Rate limited")
      expect(result.current.errorCode).toBe("RATE_LIMITED")
      expect(result.current.isGenerating).toBe(false)
    })

    it("handles network errors gracefully", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"))

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })

      expect(result.current.status).toBe("error")
      expect(result.current.error).toBe("Failed to fetch")
      expect(result.current.errorCode).toBe("NETWORK_ERROR")
    })

    it("handles unknown error types gracefully", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue("string error")

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })

      expect(result.current.status).toBe("error")
      // normalizeNetworkError in music-api.ts wraps non-Error values via
      // String(err), so the raw string propagates as the error message.
      expect(result.current.error).toBe("string error")
      expect(result.current.errorCode).toBe("NETWORK_ERROR")
    })

    it("aborts previous generation when starting a new one", async () => {
      const resolvers: Array<(value: Response) => void> = []
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })

      vi.spyOn(global, "fetch").mockImplementation(
        (input: string | URL | Request) => {
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
          // Immediately resolve upload calls so persistPromise doesn't hang
          if (url.includes("/api/music/upload")) {
            return Promise.resolve(new Response(JSON.stringify({ success: false }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }))
          }
          return new Promise((resolve) => {
            resolvers.push(resolve)
          })
        },
      )

      const { result } = renderHook(() => useMusicGeneration())

      // Start first generation
      let firstPromise: Promise<void>
      act(() => {
        firstPromise = result.current.generate("first")
      })

      // Cancel the first generation before it resolves
      act(() => {
        result.current.cancel()
      })

      // Start second generation
      let secondPromise: Promise<void>
      act(() => {
        secondPromise = result.current.generate("second")
      })

      // Resolve all pending fetches (only the second generation's fetch matters;
      // the first was cancelled so its fetch may resolve but the hook ignores it)
      await act(async () => {
        resolvers.forEach((r) => r(new Response(mockBlob, { status: 200 })))
        await Promise.allSettled([firstPromise!, secondPromise!])
      })

      // Only the second track should be stored (first was cancelled)
      expect(result.current.tracks).toHaveLength(1)
      expect(result.current.currentTrack).not.toBeNull()
      expect(result.current.currentTrack!.prompt).toBe("second")
    })
  })

  describe("cancel", () => {
    it("resets to idle state", async () => {
      // Start a generation that never resolves
      vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useMusicGeneration())

      act(() => {
        result.current.generate("test")
      })

      expect(result.current.status).toBe("generating")

      act(() => {
        result.current.cancel()
      })

      expect(result.current.status).toBe("idle")
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.errorCode).toBeNull()
    })
  })

  describe("selectTrack", () => {
    it("sets the provided track as currentTrack", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      // Generate two tracks
      await act(async () => {
        await result.current.generate("first")
      })
      const firstTrack = result.current.tracks[0]

      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(new Blob(["audio2"]), { status: 200 }),
      )

      await act(async () => {
        await result.current.generate("second")
      })

      // Current should be the second track
      expect(result.current.currentTrack!.prompt).toBe("second")

      // Select the first track
      act(() => {
        result.current.selectTrack(firstTrack)
      })

      expect(result.current.currentTrack).toBe(firstTrack)
    })
  })

  describe("removeTrack", () => {
    it("removes the track from the tracks array", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })

      const trackId = result.current.tracks[0].id

      act(() => {
        result.current.removeTrack(trackId)
      })

      expect(result.current.tracks).toHaveLength(0)
    })

    it("revokes the object URL of the removed track", async () => {
      const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL")
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })

      const track = result.current.tracks[0]

      act(() => {
        result.current.removeTrack(track.id)
      })

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(track.audioUrl)
    })

    it("selects the next track when the current track is removed", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      // Generate two tracks
      await act(async () => {
        await result.current.generate("first")
      })

      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(new Blob(["audio2"]), { status: 200 }),
      )

      await act(async () => {
        await result.current.generate("second")
      })

      // currentTrack is "second" (newest)
      const secondTrackId = result.current.currentTrack!.id

      act(() => {
        result.current.removeTrack(secondTrackId)
      })

      // Should fall back to the remaining track ("first")
      expect(result.current.currentTrack).not.toBeNull()
      expect(result.current.currentTrack!.prompt).toBe("first")
    })

    it("sets currentTrack to null when the last track is removed", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("only track")
      })

      const trackId = result.current.currentTrack!.id

      act(() => {
        result.current.removeTrack(trackId)
      })

      expect(result.current.currentTrack).toBeNull()
    })

    it("does not change currentTrack when a non-current track is removed", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("first")
      })
      const firstTrack = result.current.tracks[0]

      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(new Blob(["audio2"]), { status: 200 }),
      )

      await act(async () => {
        await result.current.generate("second")
      })

      // Current is "second"; remove "first"
      act(() => {
        result.current.removeTrack(firstTrack.id)
      })

      expect(result.current.currentTrack!.prompt).toBe("second")
      expect(result.current.tracks).toHaveLength(1)
    })
  })

  describe("clearTracks", () => {
    it("removes all tracks and resets to idle", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("track 1")
      })

      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(new Blob(["audio2"]), { status: 200 }),
      )

      await act(async () => {
        await result.current.generate("track 2")
      })

      act(() => {
        result.current.clearTracks()
      })

      expect(result.current.tracks).toEqual([])
      expect(result.current.currentTrack).toBeNull()
      expect(result.current.status).toBe("idle")
    })

    it("revokes all object URLs when clearing", async () => {
      const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL")
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })
      const audioUrl = result.current.tracks[0].audioUrl

      act(() => {
        result.current.clearTracks()
      })

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(audioUrl)
    })
  })

  describe("generation options", () => {
    it("initializes with default options", () => {
      const { result } = renderHook(() => useMusicGeneration())

      expect(result.current.options.model).toBe(DEFAULT_MUSIC_MODEL)
      expect(result.current.options.duration).toBe(60)
      expect(result.current.options.instrumental).toBe(false)
    })

    it("merges partial option updates", () => {
      const { result } = renderHook(() => useMusicGeneration())

      act(() => {
        result.current.setOptions({ model: "elevenmusic" })
      })

      expect(result.current.options.model).toBe("elevenmusic")
      expect(result.current.options.duration).toBe(60)
      expect(result.current.options.instrumental).toBe(false)

      act(() => {
        result.current.setOptions({ duration: 120, instrumental: true })
      })

      expect(result.current.options.duration).toBe(120)
      expect(result.current.options.instrumental).toBe(true)
    })

    it("uses elevenmusic query params when elevenmusic options are selected", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))

      const { result } = renderHook(() => useMusicGeneration())

      act(() => {
        result.current.setOptions({
          model: "elevenmusic",
          duration: 120,
          instrumental: true,
        })
      })

      await act(async () => {
        await result.current.generate("driving synthwave")
      })

      const calledUrl = String(fetchSpy.mock.calls[0][0])
      expect(calledUrl).toContain("model=elevenmusic")
      expect(calledUrl).toContain("duration=120")
      expect(calledUrl).toContain("instrumental=true")
      expect(result.current.currentTrack?.model).toBe("elevenmusic")
      expect(result.current.currentTrack?.instrumental).toBe(true)
    })

    it("does not include elevenmusic-only params when model is suno-v5", async () => {
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(new Response(mockBlob, { status: 200 }))

      const { result } = renderHook(() => useMusicGeneration())

      act(() => {
        result.current.setOptions({
          model: "suno-v5",
          duration: 180,
          instrumental: true,
        })
      })

      await act(async () => {
        await result.current.generate("cinematic score")
      })

      // Suno uses the POST /v1/audio/speech endpoint, not the GET shorthand.
      // The POST body contains the specific model ID (e.g., "suno-v5").
      const calledUrl = String(fetchSpy.mock.calls[0][0])
      expect(calledUrl).toContain("/v1/audio/speech")
      expect(calledUrl).not.toContain("duration=")
      expect(calledUrl).not.toContain("instrumental=")
    })
  })

  describe("cleanup on unmount", () => {
    it("revokes all object URLs when the hook unmounts", async () => {
      const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL")
      const mockBlob = new Blob(["audio"], { type: "audio/mpeg" })
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(mockBlob, { status: 200 }),
      )

      const { result, unmount } = renderHook(() => useMusicGeneration())

      await act(async () => {
        await result.current.generate("test")
      })
      const audioUrl = result.current.tracks[0].audioUrl

      unmount()

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(audioUrl)
    })
  })
})
