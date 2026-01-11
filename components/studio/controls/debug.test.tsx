// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { VideoSettingsPanel } from "./video-settings-panel"

describe("Debug", () => {
    it("debug accessibility", () => {
        const fixedOptions = [4, 6, 8];
        render(
            <VideoSettingsPanel
                settings={{ duration: 4, audio: false }}
                onSettingsChange={() => {}}
                durationConstraints={{ min: 4, max: 8, fixedOptions, defaultDuration: 4 }}
                disabled={true}
            />
        )

        // Assert the panel is in the document
        expect(screen.getByTestId("video-settings-panel")).toBeInTheDocument();

        // Assert that the duration option buttons for fixed options exist and are disabled
        fixedOptions.forEach(option => {
            const button = screen.getByTestId(`duration-option-${option}`);
            expect(button).toBeInTheDocument();
            expect(button).toBeDisabled();
        });
    })
})
