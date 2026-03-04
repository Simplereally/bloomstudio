import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MusicPromptInput, type MusicPromptInputProps } from "./music-prompt-input"

describe("MusicPromptInput", () => {
  const defaultProps: MusicPromptInputProps = {
    onGenerate: vi.fn(),
    error: null,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    defaultProps.onGenerate = vi.fn()
  })

  describe("rendering", () => {
    it("renders the textarea with a placeholder", () => {
      render(<MusicPromptInput {...defaultProps} />)
      const textareas = screen.getAllByRole("textbox")
      expect(textareas[0]).toBeInTheDocument()
      expect(textareas[0]).toHaveAttribute("placeholder")
    })

    it("shows the keyboard shortcut hint", () => {
      render(<MusicPromptInput {...defaultProps} />)
      expect(screen.getAllByText(/⌘⏎ to generate/).length).toBeGreaterThan(0)
    })

    it("shows error message when error prop is provided", () => {
      render(
        <MusicPromptInput {...defaultProps} error="Something went wrong" />,
      )
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    it("does not show error message when error is null", () => {
      render(<MusicPromptInput {...defaultProps} error={null} />)
      expect(
        screen.queryByText("Something went wrong"),
      ).not.toBeInTheDocument()
    })
  })

  describe("interaction", () => {
    it("allows typing in the textarea", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} />)

      const textarea = screen.getAllByRole("textbox")[0]
      await user.type(textarea, "chill vibes")

      expect(textarea).toHaveValue("chill vibes")
    })

    it("supports Ctrl+Enter keyboard shortcut to generate", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} />)

      const textarea = screen.getAllByRole("textbox")[0]
      await user.type(textarea, "test prompt")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("test prompt", undefined)
    })

    it("supports Meta+Enter keyboard shortcut to generate", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} />)

      const textarea = screen.getAllByRole("textbox")[0]
      await user.type(textarea, "test prompt")
      await user.keyboard("{Meta>}{Enter}{/Meta}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("test prompt", undefined)
    })

    it("does not call onGenerate on Ctrl+Enter when textarea is empty", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} />)

      const textarea = screen.getAllByRole("textbox")[0]
      await user.click(textarea)
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).not.toHaveBeenCalled()
    })

    it("trims whitespace from prompt before calling onGenerate", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} />)

      await user.type(screen.getAllByRole("textbox")[0], "  epic orchestral  ")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("epic orchestral", undefined)
    })
  })

  describe("character count", () => {
    it("shows character count when text is entered", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} />)

      await user.type(screen.getAllByRole("textbox")[0], "hello")

      // Should show "5/10,000" (charCount / max)
      expect(screen.getByText(/5\/10,000/)).toBeInTheDocument()
    })

    it("does not show character count when textarea is empty", () => {
      render(<MusicPromptInput {...defaultProps} />)
      // The char count element should not render "0/10,000"
      expect(screen.queryByText(/0\/10,000/)).not.toBeInTheDocument()
    })
  })

  describe("lyrics input", () => {
    it("shows lyrics textarea when not in instrumental mode", () => {
      render(<MusicPromptInput {...defaultProps} isInstrumental={false} />)
      expect(screen.getByTestId("lyrics-textarea")).toBeInTheDocument()
    })

    it("hides lyrics textarea when in instrumental mode", () => {
      render(<MusicPromptInput {...defaultProps} isInstrumental={true} />)
      // The container is aria-hidden and the textarea is disabled
      const lyricsContainer = screen.getByTestId("lyrics-textarea").closest("[aria-hidden]")
      expect(lyricsContainer).toHaveAttribute("aria-hidden", "true")
    })

    it("shows lyrics textarea by default (isInstrumental defaults to false)", () => {
      render(<MusicPromptInput {...defaultProps} />)
      expect(screen.getByTestId("lyrics-textarea")).toBeInTheDocument()
      expect(screen.getByTestId("lyrics-textarea")).not.toBeDisabled()
    })

    it("allows typing in the lyrics textarea", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} isInstrumental={false} />)

      const lyricsTextarea = screen.getByTestId("lyrics-textarea")
      await user.type(lyricsTextarea, "La la la")

      expect(lyricsTextarea).toHaveValue("La la la")
    })

    it("passes lyrics to onGenerate when provided", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} isInstrumental={false} />)

      const promptTextarea = screen.getAllByRole("textbox")[0]
      const lyricsTextarea = screen.getByTestId("lyrics-textarea")

      await user.type(promptTextarea, "pop song")
      await user.type(lyricsTextarea, "Hello world")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("pop song", "Hello world")
    })

    it("does not pass lyrics when in instrumental mode", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} isInstrumental={true} />)

      const promptTextarea = screen.getAllByRole("textbox")[0]
      await user.type(promptTextarea, "rock instrumental")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("rock instrumental", undefined)
    })

    it("does not pass lyrics when lyrics textarea is empty", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} isInstrumental={false} />)

      const promptTextarea = screen.getAllByRole("textbox")[0]
      await user.type(promptTextarea, "ambient track")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("ambient track", undefined)
    })

    it("supports Ctrl+Enter from lyrics textarea to generate", async () => {
      const user = userEvent.setup()
      render(<MusicPromptInput {...defaultProps} isInstrumental={false} />)

      // Type prompt first
      const promptTextarea = screen.getAllByRole("textbox")[0]
      await user.type(promptTextarea, "dreamy pop")

      // Then type lyrics and submit from there
      const lyricsTextarea = screen.getByTestId("lyrics-textarea")
      await user.type(lyricsTextarea, "Verse one")
      await user.keyboard("{Control>}{Enter}{/Control}")

      expect(defaultProps.onGenerate).toHaveBeenCalledWith("dreamy pop", "Verse one")
    })

    it("shows Lyrics (Optional) label", () => {
      render(<MusicPromptInput {...defaultProps} isInstrumental={false} />)
      expect(screen.getByText("Lyrics (Optional)")).toBeInTheDocument()
    })

    it("disables lyrics textarea when in instrumental mode", () => {
      render(<MusicPromptInput {...defaultProps} isInstrumental={true} />)
      expect(screen.getByTestId("lyrics-textarea")).toBeDisabled()
    })
  })
})
