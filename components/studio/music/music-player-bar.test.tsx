import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"
import { MusicPlayerBar } from "./music-player-bar"
import type { MusicGenerationResult } from "@/lib/music-api"

// ---------------------------------------------------------------------------
// HTMLMediaElement mock — jsdom doesn't implement play/pause/load
// ---------------------------------------------------------------------------

let audioEventHandlers: Record<string, EventListener[]>

function fireAudioEvent(event: string) {
  for (const handler of audioEventHandlers[event] ?? []) {
    handler(new Event(event))
  }
}

// Save the native addEventListener before any spies touch it
const nativeAddEventListener = HTMLMediaElement.prototype.addEventListener

beforeEach(() => {
  audioEventHandlers = {}

  vi.restoreAllMocks()

  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})

  // Intercept addEventListener to capture handlers for manual dispatch.
  // Calls the *native* method (not the spy) to avoid infinite recursion.
  vi.spyOn(HTMLMediaElement.prototype, "addEventListener").mockImplementation(
    function (this: HTMLMediaElement, event: string, handler: EventListenerOrEventListenerObject) {
      const fn = typeof handler === "function" ? handler : handler.handleEvent.bind(handler)
      if (!audioEventHandlers[event]) audioEventHandlers[event] = []
      audioEventHandlers[event].push(fn as EventListener)
      // Forward to native so the element still works for other DOM ops
      nativeAddEventListener.call(this, event, handler)
    },
  )
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrack(
  overrides: Partial<MusicGenerationResult> = {},
): MusicGenerationResult {
  return {
    id: "track-1",
    prompt: "epic orchestral soundtrack",
    audioUrl: "blob:http://localhost/test-audio",
    audioBlob: new Blob(["audio"], { type: "audio/mpeg" }),
    timestamp: Date.now(),
    estimatedDuration: 120,
    model: "suno-v5",
    instrumental: false,
    status: "done",
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MusicPlayerBar", () => {
  describe("rendering", () => {
    it("does not render when track is null", () => {
      const { container } = render(
        <MusicPlayerBar track={null} onReaction={vi.fn()} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it("renders when a done track is provided", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })
      expect(screen.getByText("epic orchestral soundtrack")).toBeInTheDocument()
    })

    it("shows the progress slider", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })
      expect(screen.getByRole("slider", { name: /track progress/i })).toBeInTheDocument()
    })
  })

  describe("play/pause button state (Bug #2 — ended event)", () => {
    it("shows Play button initially (before audio starts)", async () => {
      // Override play to return a pending promise so auto-play doesn't
      // resolve during render — we're testing the default pre-play state.
      vi.spyOn(HTMLMediaElement.prototype, "play").mockReturnValue(new Promise(() => {}))

      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })
      expect(screen.getByTitle("Play")).toBeInTheDocument()
    })

    it("shows Pause button after audio starts playing", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })

      // Simulate the audio element firing its "play" event
      await act(async () => {
        fireAudioEvent("play")
      })

      expect(screen.getByTitle("Pause")).toBeInTheDocument()
    })

    it("switches back to Play when the track ends", async () => {
      const onPlayingChange = vi.fn()
      await act(async () => {
        render(
          <MusicPlayerBar
            track={createTrack()}
            onReaction={vi.fn()}
            onPlayingChange={onPlayingChange}
          />,
        )
      })

      // Start playing
      await act(async () => {
        fireAudioEvent("play")
      })
      expect(screen.getByTitle("Pause")).toBeInTheDocument()
      expect(onPlayingChange).toHaveBeenCalledWith(true)

      // Track ends
      await act(async () => {
        fireAudioEvent("ended")
      })

      expect(screen.getByTitle("Play")).toBeInTheDocument()
      expect(onPlayingChange).toHaveBeenCalledWith(false)
    })

    it("switches to Play when the track is paused", async () => {
      const onPlayingChange = vi.fn()
      await act(async () => {
        render(
          <MusicPlayerBar
            track={createTrack()}
            onReaction={vi.fn()}
            onPlayingChange={onPlayingChange}
          />,
        )
      })

      // Start playing
      await act(async () => {
        fireAudioEvent("play")
      })
      expect(screen.getByTitle("Pause")).toBeInTheDocument()

      // Pause
      await act(async () => {
        fireAudioEvent("pause")
      })

      expect(screen.getByTitle("Play")).toBeInTheDocument()
      expect(onPlayingChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe("progress bar and time display (Bug #3)", () => {
    it("shows --:-- for duration before metadata loads", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })
      expect(screen.getByText("--:--")).toBeInTheDocument()
    })

    it("updates the slider aria-valuenow when timeupdate fires", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })

      const audio = document.querySelector("audio")!

      // Simulate duration loaded
      Object.defineProperty(audio, "duration", { value: 120, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("loadedmetadata")
      })

      // Simulate time update to 30s
      Object.defineProperty(audio, "currentTime", { value: 30, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("timeupdate")
      })

      const slider = screen.getByRole("slider", { name: /track progress/i })
      expect(slider.getAttribute("aria-valuenow")).toBe("30")
      expect(slider.getAttribute("aria-valuemax")).toBe("120")
    })

    it("displays formatted current time and duration", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })

      const audio = document.querySelector("audio")!

      // Load duration
      Object.defineProperty(audio, "duration", { value: 90, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("durationchange")
      })

      // The duration display should show 1:30
      expect(screen.getByText("1:30")).toBeInTheDocument()

      // Update current time to 45 seconds
      Object.defineProperty(audio, "currentTime", { value: 45, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("timeupdate")
      })

      // Current time should show 0:45
      expect(screen.getByText("0:45")).toBeInTheDocument()
    })

    it("sets progress fill width proportionally", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })

      const audio = document.querySelector("audio")!

      // Set duration and time
      Object.defineProperty(audio, "duration", { value: 100, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("loadedmetadata")
      })

      Object.defineProperty(audio, "currentTime", { value: 50, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("timeupdate")
      })

      const fill = screen.getByTestId("progress-fill")
      expect(fill.style.width).toBe("50%")
    })

    it("handles NaN duration gracefully", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })

      const audio = document.querySelector("audio")!

      // NaN duration (common for live streams or before load)
      Object.defineProperty(audio, "duration", { value: NaN, writable: true, configurable: true })
      await act(async () => {
        fireAudioEvent("durationchange")
      })

      // Should still show --:-- and not crash
      expect(screen.getByText("--:--")).toBeInTheDocument()

      // Progress should be 0
      const fill = screen.getByTestId("progress-fill")
      expect(fill.style.width).toBe("0%")
    })

    it("supports keyboard seeking with ArrowRight", async () => {
      await act(async () => {
        render(
          <MusicPlayerBar track={createTrack()} onReaction={vi.fn()} />,
        )
      })

      const audio = document.querySelector("audio")!
      let capturedTime = 0
      Object.defineProperty(audio, "duration", { value: 60, writable: true, configurable: true })
      Object.defineProperty(audio, "currentTime", {
        get: () => capturedTime,
        set: (v: number) => { capturedTime = v },
        configurable: true,
      })

      await act(async () => {
        fireAudioEvent("loadedmetadata")
      })

      const slider = screen.getByRole("slider", { name: /track progress/i })
      fireEvent.keyDown(slider, { key: "ArrowRight" })

      // Should have advanced by SEEK_STEP (5 seconds)
      expect(capturedTime).toBe(5)
    })
  })

  describe("onPlayingChange callback propagation", () => {
    it("notifies parent when playing state changes", async () => {
      const onPlayingChange = vi.fn()
      await act(async () => {
        render(
          <MusicPlayerBar
            track={createTrack()}
            onReaction={vi.fn()}
            onPlayingChange={onPlayingChange}
          />,
        )
      })

      await act(async () => {
        fireAudioEvent("play")
      })
      expect(onPlayingChange).toHaveBeenCalledWith(true)

      await act(async () => {
        fireAudioEvent("ended")
      })
      expect(onPlayingChange).toHaveBeenCalledWith(false)
    })
  })
})
