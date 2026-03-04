import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TooltipProvider } from "@/components/ui/tooltip"
import type { MusicGenerationOptions } from "@/hooks/use-music-generation"

import { MusicGenerationControls } from "./music-generation-controls"

function renderControls(
  options: MusicGenerationOptions,
  onOptionsChange = vi.fn(),
  disabled = false,
) {
  render(
    <TooltipProvider>
      <MusicGenerationControls
        options={options}
        onOptionsChange={onOptionsChange}
        disabled={disabled}
      />
    </TooltipProvider>,
  )

  return { onOptionsChange }
}

describe("MusicGenerationControls", () => {
  const baseOptions: MusicGenerationOptions = {
    provider: "suno",
    model: "suno-v5",
    duration: 60,
    instrumental: false,
  }

  it("renders provider selector with Suno selected", () => {
    renderControls(baseOptions)

    expect(screen.getByRole("radio", { name: /suno provider/i })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: /elevenlabs provider/i })).toHaveAttribute("aria-checked", "false")
  })

  it("calls onOptionsChange when selecting ElevenLabs provider", async () => {
    const user = userEvent.setup()
    const { onOptionsChange } = renderControls(baseOptions)

    await user.click(screen.getByRole("radio", { name: /elevenlabs provider/i }))

    expect(onOptionsChange).toHaveBeenCalledWith({ provider: "elevenlabs", model: "elevenmusic", instrumental: false })
  })

  it("resets instrumental to false when switching providers", async () => {
    const user = userEvent.setup()
    const { onOptionsChange } = renderControls({
      ...baseOptions,
      provider: "elevenlabs",
      model: "elevenmusic",
      instrumental: true,
    })

    await user.click(screen.getByRole("radio", { name: /suno provider/i }))

    expect(onOptionsChange).toHaveBeenCalledWith({ provider: "suno", model: "suno-v5", instrumental: false })
  })

  it("shows ElevenLabs-only duration controls and forwards duration updates", async () => {
    const user = userEvent.setup()
    const { onOptionsChange } = renderControls({
      ...baseOptions,
      provider: "elevenlabs",
      model: "elevenmusic",
    })

    expect(screen.getByTestId("duration-control")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /set duration to 30 seconds/i }))

    expect(onOptionsChange).toHaveBeenCalledWith({ duration: 30 })
  })

  it("shows instrumental toggle for all models and forwards changes", async () => {
    const user = userEvent.setup()
    const { onOptionsChange } = renderControls(baseOptions)

    // Instrumental toggle is now visible for all models (not just ElevenLabs)
    expect(screen.getByTestId("instrumental-control")).toBeInTheDocument()

    await user.click(screen.getByTestId("instrumental-switch"))

    expect(onOptionsChange).toHaveBeenCalledWith({ instrumental: true })
  })

  it("hides ElevenLabs-specific duration control when Suno is selected", () => {
    renderControls(baseOptions)

    // Duration control is conditionally rendered only for ElevenLabs
    expect(screen.queryByTestId("duration-control")).not.toBeInTheDocument()
  })

  it("displays Suno description when Suno provider is selected", () => {
    renderControls(baseOptions)

    expect(screen.getByText(/full song generation/i)).toBeInTheDocument()
  })

  it("displays ElevenLabs description when that provider is selected", () => {
    renderControls({ ...baseOptions, provider: "elevenlabs", model: "elevenmusic" })

    expect(screen.getByText(/instrumental and vocal tracks/i)).toBeInTheDocument()
  })
})
