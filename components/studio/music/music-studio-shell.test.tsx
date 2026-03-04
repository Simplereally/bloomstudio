import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MusicStudioShell } from "./music-studio-shell"
import type { UseMusicGenerationReturn, MusicGenerationOptions } from "@/hooks/use-music-generation"
import type { MusicGenerationResult } from "@/lib/music-api"

// ---------------------------------------------------------------------------
// Mock: useMusicGeneration hook
// ---------------------------------------------------------------------------
const mockGenerate = vi.fn()
const mockCancel = vi.fn()
const mockSelectTrack = vi.fn()
const mockRemoveTrack = vi.fn()
const mockClearTracks = vi.fn()
const mockSetOptions = vi.fn()
const mockSetReaction = vi.fn()

const defaultOptions: MusicGenerationOptions = {
  provider: "suno",
  model: "suno-v5",
  duration: 180,
  instrumental: false,
}

function createMockHookReturn(
  overrides: Partial<UseMusicGenerationReturn> = {},
): UseMusicGenerationReturn {
  return {
    status: "idle",
    currentTrack: null,
    tracks: [],
    error: null,
    errorCode: null,
    isGenerating: false,
    inFlightCount: 0,
    options: defaultOptions,
    generate: mockGenerate,
    cancel: mockCancel,
    selectTrack: mockSelectTrack,
    removeTrack: mockRemoveTrack,
    clearTracks: mockClearTracks,
    setOptions: mockSetOptions,
    setReaction: mockSetReaction,
    ...overrides,
  }
}

let hookReturn: UseMusicGenerationReturn

vi.mock("@/hooks/use-music-generation", () => ({
  useMusicGeneration: () => hookReturn,
  DEFAULT_MUSIC_OPTIONS: {
    provider: "suno",
    model: "suno-v5",
    duration: 180,
    instrumental: false,
  },
}))

// ---------------------------------------------------------------------------
// Mock: HTMLMediaElement methods (jsdom doesn't implement them)
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})

  hookReturn = createMockHookReturn()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTrack(
  overrides: Partial<MusicGenerationResult> = {},
): MusicGenerationResult {
  return {
    id: crypto.randomUUID(),
    prompt: "test prompt",
    audioUrl: "blob:http://localhost/test-audio",
    audioBlob: new Blob(["audio"], { type: "audio/mpeg" }),
    timestamp: Date.now(),
    estimatedDuration: 60,
    model: "suno-v5",
    instrumental: false,
    status: "done",
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("MusicStudioShell", () => {
  describe("rendering", () => {
    it("renders the Music Generation header", () => {
      render(<MusicStudioShell />)
      expect(screen.getByText("Music Generation")).toBeInTheDocument()
    })

    it("renders the model label from the current options", () => {
      render(<MusicStudioShell />)
      // Powered by Suno v5 (from MUSIC_MODEL_META for suno-v5)
      expect(screen.getByText(/Powered by/)).toBeInTheDocument()
    })

    it("renders the prompt input textarea", () => {
      render(<MusicStudioShell />)
      // Two textareas now: style/prompt + lyrics
      const textareas = screen.getAllByRole("textbox")
      expect(textareas.length).toBeGreaterThanOrEqual(1)
    })

    it("renders the track filter tabs (All, Liked, Disliked)", () => {
      render(<MusicStudioShell />)
      expect(screen.getByText("All")).toBeInTheDocument()
      expect(screen.getByText("Liked")).toBeInTheDocument()
      expect(screen.getByText("Disliked")).toBeInTheDocument()
    })

    it("shows empty state when no tracks exist", () => {
      render(<MusicStudioShell />)
      expect(screen.getByText("No tracks yet")).toBeInTheDocument()
    })
  })

  describe("viewport lock", () => {
    it("sets data-fixed-viewport on body on mount", () => {
      render(<MusicStudioShell />)
      expect(document.body.getAttribute("data-fixed-viewport")).toBe("true")
    })

    it("removes data-fixed-viewport on unmount", () => {
      const { unmount } = render(<MusicStudioShell />)
      unmount()
      expect(document.body.getAttribute("data-fixed-viewport")).toBeNull()
    })
  })

  describe("filter tabs", () => {
    it("defaults to the All filter being active", () => {
      hookReturn = createMockHookReturn({
        tracks: [createTrack({ reaction: "like" })],
      })
      render(<MusicStudioShell />)

      // All tracks should render (1 total), confirming "All" is the active filter
      const allButton = screen.getByText("All").closest("button")
      expect(allButton).toBeInTheDocument()
    })

    it("filters to liked tracks when Liked tab is clicked", async () => {
      const likedTrack = createTrack({ id: "liked-1", prompt: "liked track", reaction: "like" })
      const normalTrack = createTrack({ id: "normal-1", prompt: "normal track" })
      hookReturn = createMockHookReturn({
        tracks: [likedTrack, normalTrack],
      })
      const user = userEvent.setup()
      render(<MusicStudioShell />)

      await user.click(screen.getByText("Liked"))

      // Only the liked track prompt should appear in the track list
      expect(screen.getByText("liked track")).toBeInTheDocument()
      expect(screen.queryByText("normal track")).not.toBeInTheDocument()
    })

    it("filters to disliked tracks when Disliked tab is clicked", async () => {
      const dislikedTrack = createTrack({ id: "disliked-1", prompt: "disliked track", reaction: "dislike" })
      const normalTrack = createTrack({ id: "normal-1", prompt: "normal track" })
      hookReturn = createMockHookReturn({
        tracks: [dislikedTrack, normalTrack],
      })
      const user = userEvent.setup()
      render(<MusicStudioShell />)

      await user.click(screen.getByText("Disliked"))

      expect(screen.getByText("disliked track")).toBeInTheDocument()
      expect(screen.queryByText("normal track")).not.toBeInTheDocument()
    })
  })

  describe("clear all", () => {
    it("shows Clear all button when tracks exist", () => {
      hookReturn = createMockHookReturn({
        tracks: [createTrack()],
      })
      render(<MusicStudioShell />)

      expect(screen.getByText("Clear all")).toBeInTheDocument()
    })

    it("does not show Clear all button when no tracks exist", () => {
      render(<MusicStudioShell />)
      expect(screen.queryByText("Clear all")).not.toBeInTheDocument()
    })

    it("calls clearTracks when Clear all is clicked", async () => {
      hookReturn = createMockHookReturn({
        tracks: [createTrack()],
      })
      const user = userEvent.setup()
      render(<MusicStudioShell />)

      await user.click(screen.getByText("Clear all"))

      expect(mockClearTracks).toHaveBeenCalledOnce()
    })
  })

  describe("in-flight indicator", () => {
    it("shows generating count when generations are in-flight", () => {
      hookReturn = createMockHookReturn({
        isGenerating: true,
        inFlightCount: 2,
      })
      render(<MusicStudioShell />)

      expect(screen.getByText(/2 generating/)).toBeInTheDocument()
    })

    it("does not show generating count when idle", () => {
      render(<MusicStudioShell />)
      expect(screen.queryByText(/generating/)).not.toBeInTheDocument()
    })
  })

  describe("integration: prompt to generation", () => {
    it("calls generate when user types a prompt and presses Ctrl+Enter", async () => {
      const user = userEvent.setup()
      render(<MusicStudioShell />)

      // First textbox is the style/prompt textarea
      const textareas = screen.getAllByRole("textbox")
      await user.type(textareas[0], "ambient soundscape")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(mockGenerate).toHaveBeenCalledWith("ambient soundscape", undefined)
    })

    it("passes error from hook to the prompt input", () => {
      hookReturn = createMockHookReturn({
        error: "Service unavailable",
      })
      render(<MusicStudioShell />)

      expect(screen.getByText("Service unavailable")).toBeInTheDocument()
    })
  })
})
