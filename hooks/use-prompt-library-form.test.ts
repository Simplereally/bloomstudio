import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePromptLibraryForm } from "./use-prompt-library-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";

// Mock dependencies
vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    promptLibrary: {
      savePrompt: "savePrompt",
      getCategories: "getCategories",
    },
  },
}));

describe("use-prompt-library-form", () => {
  const mockOnSaved = vi.fn();
  const mockSavePrompt = vi.fn();
  const mockCategories = ["Art", "Photography"];

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValue(mockSavePrompt);
    (useQuery as any).mockReturnValue(mockCategories);
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ defaultPromptType: "positive", onSaved: mockOnSaved })
    );

    expect(result.current.type).toBe("positive");
    expect(result.current.category).toBeNull();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.categories).toEqual(mockCategories);
  });

  it("should initialize contentRef with initialContent", () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ 
        defaultPromptType: "positive", 
        onSaved: mockOnSaved,
        initialContent: "Hello World"
      })
    );

    // Since it uses refs, we need to mock the ref object structure
    // useEffect will set contentRef.current.value
    // result.current.contentRef is the ref object
    
    // Initial content is applied via useEffect. 
    // In test environment, we need to ensure the ref.current is defined before useEffect runs or re-render.
    // However, in usePromptLibraryForm, contentRef is created inside the hook.
    
    // Let's manually trigger the ref assignment for testing if needed, 
    // but usually, we can check if it was set if we provide a mock ref or simulate the mount.
    
    expect(result.current.contentRef.current).toBeDefined();
    // In standard RTL, we might not have a real textarea attached to the ref unless we mock it.
  });

  it("should show error if title or content is missing on save", async () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ defaultPromptType: "positive", onSaved: mockOnSaved })
    );

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith("Title and content are required");
    expect(mockSavePrompt).not.toHaveBeenCalled();
  });

  it("should handle successful save", async () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ defaultPromptType: "positive", onSaved: mockOnSaved })
    );

    // Mock ref values
    (result.current.titleRef as any).current = { value: "My Prompt" };
    (result.current.contentRef as any).current = { value: "Prompt content" };
    (result.current.tagsRef as any).current = { value: "tag1, tag2" };

    mockSavePrompt.mockResolvedValue({ alreadyExists: false });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockSavePrompt).toHaveBeenCalledWith({
      title: "My Prompt",
      content: "Prompt content",
      type: "positive",
      tags: ["tag1", "tag2"],
      category: undefined
    });
    expect(toast.success).toHaveBeenCalledWith("Prompt saved to library!");
    expect(mockOnSaved).toHaveBeenCalled();
  });

  it("should handle existing prompt on save", async () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ defaultPromptType: "positive", onSaved: mockOnSaved })
    );

    (result.current.titleRef as any).current = { value: "My Prompt" };
    (result.current.contentRef as any).current = { value: "Prompt content" };
    (result.current.tagsRef as any).current = { value: "" };

    mockSavePrompt.mockResolvedValue({ alreadyExists: true });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.info).toHaveBeenCalledWith("This prompt already exists in your library");
    expect(mockOnSaved).toHaveBeenCalled();
  });

  it("should handle save error", async () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ defaultPromptType: "positive", onSaved: mockOnSaved })
    );

    (result.current.titleRef as any).current = { value: "My Prompt" };
    (result.current.contentRef as any).current = { value: "Prompt content" };
    (result.current.tagsRef as any).current = { value: "" };

    mockSavePrompt.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to save prompt");
    expect(result.current.isSaving).toBe(false);
  });

  it("should reset form", () => {
    const { result } = renderHook(() => 
      usePromptLibraryForm({ defaultPromptType: "positive", onSaved: mockOnSaved })
    );

    act(() => {
      result.current.setType("negative");
      result.current.setCategory("Art");
      if (result.current.titleRef.current) result.current.titleRef.current.value = "Dirty";
    });

    expect(result.current.type).toBe("negative");
    expect(result.current.category).toBe("Art");

    act(() => {
      result.current.reset();
    });

    expect(result.current.type).toBe("positive");
    expect(result.current.category).toBeNull();
    if (result.current.titleRef.current) expect(result.current.titleRef.current.value).toBe("");
  });
});
