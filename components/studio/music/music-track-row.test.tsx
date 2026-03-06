import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MusicTrackRow } from "./music-track-row"
import type { MusicGenerationResult } from "@/lib/music-api"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTrack(
  overrides: Partial<MusicGenerationResult> = {},
): MusicGenerationResult {
  return {
    id: crypto.randomUUID(),
    prompt: "chill lofi beat",
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

const noop = () => {}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MusicTrackRow", () => {
  describe("play/pause indicator icon (Bug #1)", () => {
    it("shows a Play icon when the row is NOT active", () => {
      const track = createTrack()
      const { container } = render(
        <MusicTrackRow
          track={track}
          isActive={false}
          isPlaying={false}
          onSelect={noop}
          onReaction={noop}
          onRemove={noop}
        />,
      )

      // Should NOT contain equalizer bars
      expect(screen.queryByTestId("equalizer-bars")).not.toBeInTheDocument()

      // lucide Play icon has class "lucide-play"
      const playIcon = container.querySelector(".lucide-play")
      expect(playIcon).toBeTruthy()

      // No Pause icon should exist
      const pauseIcon = container.querySelector(".lucide-pause")
      expect(pauseIcon).toBeNull()
    })

    it("shows equalizer bars when the row is active AND playing", () => {
      const track = createTrack()
      render(
        <MusicTrackRow
          track={track}
          isActive={true}
          isPlaying={true}
          onSelect={noop}
          onReaction={noop}
          onRemove={noop}
        />,
      )

      expect(screen.getByTestId("equalizer-bars")).toBeInTheDocument()
    })

    it("shows a Play icon (not Pause) when the row is active but NOT playing", () => {
      const track = createTrack()
      const { container } = render(
        <MusicTrackRow
          track={track}
          isActive={true}
          isPlaying={false}
          onSelect={noop}
          onReaction={noop}
          onRemove={noop}
        />,
      )

      // Should NOT show equalizer bars
      expect(screen.queryByTestId("equalizer-bars")).not.toBeInTheDocument()

      // The icon area (10x10 box) should contain a Play icon, not a Pause icon
      const iconArea = container.querySelector("[class*='h-10'][class*='w-10']")
      expect(iconArea).toBeTruthy()

      const playIcon = iconArea!.querySelector(".lucide-play")
      expect(playIcon).toBeTruthy()

      const pauseIcon = iconArea!.querySelector(".lucide-pause")
      expect(pauseIcon).toBeNull()
    })
  })

  describe("generating & error states", () => {
    it("renders generating state with spinner", () => {
      const track = createTrack({ status: "generating" })
      render(
        <MusicTrackRow
          track={track}
          onSelect={noop}
          onReaction={noop}
          onRemove={noop}
        />,
      )

      expect(screen.getByText("Generating…")).toBeInTheDocument()
    })

    it("renders error state with dismiss button", () => {
      const track = createTrack({
        status: "error",
        errorMessage: "Server error",
      })
      const onRemove = vi.fn()
      render(
        <MusicTrackRow
          track={track}
          onSelect={noop}
          onReaction={noop}
          onRemove={onRemove}
        />,
      )

      expect(screen.getByText("Server error")).toBeInTheDocument()
      expect(screen.getByText("Dismiss")).toBeInTheDocument()
    })
  })
})
