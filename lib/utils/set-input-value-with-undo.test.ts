import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setInputValueWithUndo } from "./set-input-value-with-undo";

describe("setInputValueWithUndo", () => {
  let textarea: HTMLTextAreaElement;

  beforeEach(() => {
    textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    
    // Add execCommand if missing in JSDOM and mock it
    if (!document.execCommand) {
        document.execCommand = vi.fn();
    } else {
        vi.spyOn(document, "execCommand");
    }
    
    // Mock focus and select
    textarea.focus = vi.fn();
    textarea.select = vi.fn();
  });

  afterEach(() => {
    if (textarea.parentNode) {
      document.body.removeChild(textarea);
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should successfully set value using execCommand", () => {
    vi.mocked(document.execCommand).mockReturnValue(true);
    
    setInputValueWithUndo(textarea, "new value");
    
    expect(textarea.focus).toHaveBeenCalled();
    expect(textarea.select).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("insertText", false, "new value");
  });

  it("should use fallback if execCommand returns false", () => {
    vi.mocked(document.execCommand).mockReturnValue(false);
    const dispatchSpy = vi.spyOn(textarea, "dispatchEvent");
    
    setInputValueWithUndo(textarea, "fallback value");
    
    expect(textarea.value).toBe("fallback value");
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(InputEvent));
    expect(dispatchSpy.mock.calls[0][0].type).toBe("input");
  });

  it("should use fallback if execCommand throws", () => {
    vi.mocked(document.execCommand).mockImplementation(() => {
      throw new Error("Exec error");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    setInputValueWithUndo(textarea, "error value");
    
    expect(textarea.value).toBe("error value");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should temporarily enable a disabled element", () => {
    textarea.disabled = true;
    vi.mocked(document.execCommand).mockReturnValue(true);
    
    setInputValueWithUndo(textarea, "test");
    
    expect(textarea.disabled).toBe(true); 
  });

  it("should restore focus to the previously focused element", () => {
    vi.useFakeTimers();
    const otherButton = document.createElement("button");
    document.body.appendChild(otherButton);
    otherButton.focus = vi.fn();
    
    // Mock activeElement via spy
    vi.spyOn(document, "activeElement", "get").mockReturnValue(otherButton);
    vi.mocked(document.execCommand).mockReturnValue(true);
    
    setInputValueWithUndo(textarea, "test");
    
    vi.runAllTimers();
    
    expect(otherButton.focus).toHaveBeenCalled();
    document.body.removeChild(otherButton);
  });
});
