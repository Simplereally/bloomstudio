import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PromptListView } from './prompt-list-view'
import type { Id } from '@/convex/_generated/dataModel'
import type { Prompt } from './types'
import * as React from "react"

// Mock PromptCard to simplify testing the list view
vi.mock('./prompt-card', () => ({
    PromptCard: ({
        prompt,
        onSelect,
        onCopy,
        onInsert,
        onRemove,
    }: {
        prompt: Prompt
        onSelect: () => void
        onCopy: () => void
        onInsert: () => void
        onRemove: () => void
    }) => (
        <div data-testid="prompt-card">
            <span>{prompt.title}</span>
            <button onClick={onSelect}>Select</button>
            <button onClick={onCopy}>Copy</button>
            <button onClick={onInsert}>Insert</button>
            <button onClick={onRemove}>Remove</button>
        </div>
    )
}))

vi.mock('./prompt-library-header', () => ({
    PromptLibraryHeader: () => <div data-testid="prompt-library-header">Header</div>
}))

describe('PromptListView', () => {
    function createPromptId(value: string): Id<"prompts"> {
        return value as unknown as Id<"prompts">
    }

    const defaultProps: React.ComponentProps<typeof PromptListView> = {
        searchQuery: '',
        onSearchChange: vi.fn(),
        searchInputRef: React.createRef<HTMLInputElement>(),
        typeFilter: 'all' as const,
        onTypeFilterChange: vi.fn(),
        prompts: [],
        isLoading: false,
        onSelectPrompt: vi.fn(),
        onCopyPrompt: vi.fn(),
        onInsertPrompt: vi.fn(),
        onRemovePrompt: vi.fn(),
        onShowSaveForm: vi.fn(),
    }

    const mockPrompts: Prompt[] = [
        { _id: createPromptId('1'), title: 'Prompt 1', content: 'Content 1', type: 'positive', tags: [], createdAt: Date.now() },
        { _id: createPromptId('2'), title: 'Prompt 2', content: 'Content 2', type: 'negative', tags: [], createdAt: Date.now() },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders search input and filter', () => {
        render(<PromptListView {...defaultProps} />)
        expect(screen.getByPlaceholderText('Search prompts...')).toBeInTheDocument()
        expect(screen.getByText('All Types')).toBeInTheDocument() // Select value display
    })

    it('renders loading state', () => {
        render(<PromptListView {...defaultProps} isLoading={true} />)
        // Look for loading spinner or lack of empty state
        // The component usually shows a loader.
        // We can check for the loader class or simple existence.
        // Assuming the loader is an SVG, looking for it:
        // Actually best is to check that prompts are not shown and empty state text is likely not shown if loading logic covers it.
        // Reading code: if (isLoading) show loader, else if (prompts) show list, else show empty.

        // Since we don't have text on loader, let's query selector for animate-spin
        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
    })

    it('renders list of prompts when data is available', () => {
        render(<PromptListView {...defaultProps} prompts={mockPrompts} />)
        const cards = screen.getAllByTestId('prompt-card')
        expect(cards).toHaveLength(2)
        expect(screen.getByText('Prompt 1')).toBeInTheDocument()
        expect(screen.getByText('Prompt 2')).toBeInTheDocument()
    })

    it('renders empty state when no prompts and no search', () => {
        render(<PromptListView {...defaultProps} prompts={[]} />)
        expect(screen.getByText('Your library is empty')).toBeInTheDocument()
        expect(screen.getByText('Save prompts to build your collection')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Add your first prompt/i })).toBeInTheDocument()
    })

    it('renders no matches state when search is active but no results', () => {
        render(<PromptListView {...defaultProps} prompts={[]} searchQuery="xyz" />)
        expect(screen.getByText('No matches found')).toBeInTheDocument()
        expect(screen.getByText('Try different keywords')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Add your first prompt/i })).not.toBeInTheDocument()
    })

    it('calls onSearchChange when typing in search', async () => {
        const onSearchChange = vi.fn()
        const user = userEvent.setup()
        render(<PromptListView {...defaultProps} onSearchChange={onSearchChange} />)

        const input = screen.getByPlaceholderText('Search prompts...')
        await user.type(input, 'test')

        // Since it's controlled, onSearchChange is called for each char.
        expect(onSearchChange).toHaveBeenCalled()
    })

    it('calls onShowSaveForm when plus button is clicked', async () => {
        const onShowSaveForm = vi.fn()
        const user = userEvent.setup()
        render(<PromptListView {...defaultProps} prompts={mockPrompts} onShowSaveForm={onShowSaveForm} />)

        const headerAddButton = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-plus'))
        expect(headerAddButton).toBeDefined()
        await user.click(headerAddButton!)
        expect(onShowSaveForm).toHaveBeenCalled()
    })

    it('passes actions to prompt cards', async () => {
        const onSelectPrompt = vi.fn()
        const user = userEvent.setup()
        render(<PromptListView {...defaultProps} prompts={mockPrompts} onSelectPrompt={onSelectPrompt} />)

        const selectBtn = screen.getAllByText('Select')[0]
        await user.click(selectBtn)
        expect(onSelectPrompt).toHaveBeenCalledWith(mockPrompts[0])
    })

    it('calls onSearchChange to clear when clear button clicked', async () => {
        const onSearchChange = vi.fn()
        const user = userEvent.setup()
        // Needs searchQuery to show clear button
        render(<PromptListView {...defaultProps} searchQuery="foo" onSearchChange={onSearchChange} />)

        // Clear button has X icon
        const buttons = screen.getAllByRole('button')
        // Usually the X button is inside the search container.
        const clearButton = buttons.find(b => b.querySelector('.lucide-x'))

        await user.click(clearButton!)
        expect(onSearchChange).toHaveBeenCalledWith("")
    })
})
