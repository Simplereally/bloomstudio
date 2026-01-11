// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { VideoSettingsPanel } from "./video-settings-panel"

describe("Debug", () => {
    it("debug accessibility", () => {
        render(
            <VideoSettingsPanel
                settings={{ duration: 4, audio: false }}
                onSettingsChange={() => {}}
                durationConstraints={{ min: 4, max: 8, fixedOptions: [4, 6, 8], defaultDuration: 4 }}
                disabled={true}
            />
        )
        screen.debug()
    })
})
