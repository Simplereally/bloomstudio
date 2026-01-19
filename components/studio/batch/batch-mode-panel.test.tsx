import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchModePanel, BatchModeSettings } from "./batch-mode-panel";

// Mock Switch, Input, Label
vi.mock("@/components/ui/switch", () => ({ 
    Switch: ({ checked, onCheckedChange, ...props }: any) => (
        <button 
            role="switch" 
            aria-checked={checked} 
            onClick={() => onCheckedChange(!checked)} 
            {...props} 
        />
    )
}));

vi.mock("@/components/ui/input", () => ({ 
    Input: (props: any) => <input data-testid="input" {...props} /> 
}));

vi.mock("@/components/ui/label", () => ({ 
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label> 
}));

describe("BatchModePanel", () => {
    const defaultSettings: BatchModeSettings = {
        enabled: false,
        count: 10,
    };
    const onSettingsChange = vi.fn();

    it("renders enable toggle", () => {
        render(
            <BatchModePanel 
                settings={defaultSettings} 
                onSettingsChange={onSettingsChange} 
            />
        );
        expect(screen.getByText("Enable Batch Generation")).toBeInTheDocument();
        expect(screen.getByRole("switch")).toBeInTheDocument();
        expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });

    it("toggles enabled state", () => {
        render(
            <BatchModePanel 
                settings={defaultSettings} 
                onSettingsChange={onSettingsChange} 
            />
        );
        fireEvent.click(screen.getByRole("switch"));
        expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, enabled: true });
    });

    it("shows count input when enabled", () => {
        render(
            <BatchModePanel 
                settings={{ ...defaultSettings, enabled: true }} 
                onSettingsChange={onSettingsChange} 
            />
        );
        expect(screen.getByTestId("batch-count-input")).toBeInTheDocument();
        expect(screen.getByLabelText("Number of Images")).toBeInTheDocument();
    });

    it("hides count input when disabled", () => {
        render(
            <BatchModePanel 
                settings={{ ...defaultSettings, enabled: false }} 
                onSettingsChange={onSettingsChange} 
            />
        );
        expect(screen.queryByTestId("batch-count-input")).not.toBeInTheDocument();
    });

    it("updates count with valid input", () => {
        render(
            <BatchModePanel 
                settings={{ ...defaultSettings, enabled: true }} 
                onSettingsChange={onSettingsChange} 
            />
        );
        const input = screen.getByTestId("batch-count-input");
        fireEvent.change(input, { target: { value: "50" } });
        expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, enabled: true, count: 50 });
    });

    it("clamps count value", () => {
        render(
            <BatchModePanel 
                settings={{ ...defaultSettings, enabled: true }} 
                onSettingsChange={onSettingsChange} 
            />
        );
        const input = screen.getByTestId("batch-count-input");
        
        // Too low
        fireEvent.change(input, { target: { value: "0" } });
        expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
        
        // Too high
        fireEvent.change(input, { target: { value: "2000" } });
        expect(onSettingsChange).toHaveBeenCalledWith(expect.objectContaining({ count: 1000 }));
    });
});
