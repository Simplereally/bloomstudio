// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { VideoSettingsPanel, type VideoSettings } from "./video-settings-panel"
import type { VideoDurationConstraints } from "@/lib/config/models"

describe("VideoSettingsPanel", () => {
    const defaultSettings: VideoSettings = {
        duration: 5,
        audio: false,
    }

    const seedanceConstraints: VideoDurationConstraints = {
        min: 2,
        max: 10,
        defaultDuration: 5,
    }

    const veoConstraints: VideoDurationConstraints = {
        min: 4,
        max: 8,
        fixedOptions: [4, 6, 8],
        defaultDuration: 4,
    }

    const mockOnSettingsChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("rendering", () => {
        it("renders nothing when durationConstraints is undefined", () => {
            const { container } = render(
                <VideoSettingsPanel
                    settings={defaultSettings}
                    onSettingsChange={mockOnSettingsChange}
                />
            )
            expect(container.firstChild).toBeNull()
        })

        it("renders video settings panel when durationConstraints are provided", () => {
            render(
                <VideoSettingsPanel
                    settings={defaultSettings}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={seedanceConstraints}
                />
            )
            expect(screen.getByTestId("video-settings-panel")).toBeInTheDocument()
        })


    })

    describe("duration control", () => {
        it("renders slider for range constraints (seedance)", () => {
            render(
                <VideoSettingsPanel
                    settings={defaultSettings}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={seedanceConstraints}
                />
            )
            expect(screen.getByTestId("duration-slider")).toBeInTheDocument()
        })

        it("renders toggle group for fixed options (veo)", () => {
            render(
                <VideoSettingsPanel
                    settings={{ duration: 4, audio: false }}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={veoConstraints}
                />
            )
            expect(screen.getByTestId("duration-option-4")).toBeInTheDocument()
            expect(screen.getByTestId("duration-option-6")).toBeInTheDocument()
            expect(screen.getByTestId("duration-option-8")).toBeInTheDocument()
        })

        it("calls onSettingsChange when duration option is clicked", () => {
            render(
                <VideoSettingsPanel
                    settings={{ duration: 4, audio: false }}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={veoConstraints}
                />
            )

            fireEvent.click(screen.getByTestId("duration-option-6"))

            expect(mockOnSettingsChange).toHaveBeenCalledWith({
                duration: 6,
                audio: false,
            })
        })
    })

    describe("audio control", () => {
        it("shows audio toggle when supportsAudio is true", () => {
            render(
                <VideoSettingsPanel
                    settings={defaultSettings}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={veoConstraints}
                    supportsAudio={true}
                />
            )
            expect(screen.getByTestId("audio-control")).toBeInTheDocument()
            expect(screen.getByTestId("audio-switch")).toBeInTheDocument()
        })

        it("does not show audio toggle when supportsAudio is false", () => {
            render(
                <VideoSettingsPanel
                    settings={defaultSettings}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={seedanceConstraints}
                    supportsAudio={false}
                />
            )
            expect(screen.queryByTestId("audio-control")).not.toBeInTheDocument()
        })

        it("calls onSettingsChange when audio is toggled", () => {
            render(
                <VideoSettingsPanel
                    settings={{ duration: 4, audio: false }}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={veoConstraints}
                    supportsAudio={true}
                />
            )

            fireEvent.click(screen.getByTestId("audio-switch"))

            expect(mockOnSettingsChange).toHaveBeenCalledWith({
                duration: 4,
                audio: true,
            })
        })
    })

    describe("disabled state", () => {
        it("disables controls when disabled prop is true", () => {
            render(
                <VideoSettingsPanel
                    settings={{ duration: 4, audio: false }}
                    onSettingsChange={mockOnSettingsChange}
                    durationConstraints={veoConstraints}
                    supportsAudio={true}
                    disabled={true}
                />
            )

            expect(screen.getByTestId("audio-switch")).toBeDisabled()
        })
    })
})
