import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromptDetail } from "./prompt-detail";
import type { Id } from "@/convex/_generated/dataModel";
import type { Prompt } from "./types";

vi.mock("./prompt-library-header", () => ({
  PromptLibraryHeader: () => <div data-testid="prompt-library-header">Header</div>,
}));

describe("PromptDetail", () => {
  function createPromptId(value: string): Id<"prompts"> {
    return value as unknown as Id<"prompts">;
  }

  const mockPrompt: Prompt = {
    _id: createPromptId("1"),
    title: "Test Prompt Title",
    content: "This is the test prompt content.",
    type: "positive",
    tags: ["tag1", "tag2"],
    category: "TestCategory",
    createdAt: Date.now(),
  };

  const defaultProps = {
    prompt: mockPrompt,
    onBack: vi.fn(),
    onCopy: vi.fn(),
    onInsert: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders prompt details correctly", () => {
    render(<PromptDetail {...defaultProps} />);

    expect(screen.getByText(mockPrompt.title)).toBeInTheDocument();
    expect(screen.getByText(mockPrompt.content)).toBeInTheDocument();
    expect(screen.getByText("Positive")).toBeInTheDocument(); // Badge
    const category = mockPrompt.category;
    if (!category) {
      throw new Error("Expected mockPrompt.category to be defined");
    }
    expect(screen.getByText(category)).toBeInTheDocument();
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
  });

  it("renders negative style for negative prompts", () => {
    const negPrompt = { ...mockPrompt, type: "negative" as const };
    render(<PromptDetail {...defaultProps} prompt={negPrompt} />);

    expect(screen.getByText("Negative")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<PromptDetail {...defaultProps} onBack={onBack} />);

    const backBtn = screen.getByText("Back to library");
    await user.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onCopy when copy button is clicked", async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(<PromptDetail {...defaultProps} onCopy={onCopy} />);

    const copyBtn = screen.getByRole("button", { name: /Copy/i });
    await user.click(copyBtn);
    expect(onCopy).toHaveBeenCalled();

    // Expect "Copied!" text to appear (state change)
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("calls onInsert when insert button is clicked", async () => {
    const onInsert = vi.fn();
    const user = userEvent.setup();
    render(<PromptDetail {...defaultProps} onInsert={onInsert} />);

    const insertBtn = screen.getByRole("button", { name: /Insert Prompt/i });
    await user.click(insertBtn);
    expect(onInsert).toHaveBeenCalled();
  });

  it("calls onRemove when remove is confirmed", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<PromptDetail {...defaultProps} onRemove={onRemove} />);

    // Use regex for flexible matching if text is split
    const removeTrigger = screen.getByRole("button", { name: /Remove/i });
    await user.click(removeTrigger);

    // Alert Dialog should be open
    expect(screen.getByText("Remove prompt?")).toBeInTheDocument();

    // Click confirm
    // The confirm button in AlertDialog usually has "Remove" text too.
    // We need to be specific or use getAllByText.
    // The confirm button likely has class bg-destructive.
    // Or we can look for the button inside the dialog.

    // Alternatively, finding the specific button by testid would help, but we don't have one.
    // We can find by the text "Remove" which appears twice (trigger + value).
    // Wait, the trigger button says "Remove" (with text) and the action button says "Remove".

    // Let's click the last one, or the one in the dialog.
    // @radix-ui/react-alert-dialog renders content in a portal usually.
    // `screen` should see it.

    // Let's try `user.click(screen.getByRole('button', { name: 'Remove', hidden: false }))` inside the dialog options?
    // Note: Radix UI portals might render outside the container `render` returns, but `screen` sees document.body.

    // Let's assume the last "Remove" button is the confirm one.
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    const confirmButton = removeButtons[removeButtons.length - 1];

    await user.click(confirmButton);
    expect(onRemove).toHaveBeenCalled();
  });
});
