import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PromptListView } from './prompt-list-view'

// Mock PromptCard to simplify testing the list view
vi.mock('./prompt-card', () => ({
    PromptCard: ({ prompt, onSelect, onCopy, onInsert, onRemove }: any) => (
        <div data-testid="prompt-card">
            <span>{prompt.title}</span>
            <button onClick={() => onSelect(prompt)}>Select</button>
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
    const defaultProps = {
        searchQuery: '',
        onSearchChange: vi.fn(),
        searchInputRef: { current: null },
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

    const mockPrompts = [
        { _id: '1', title: 'Prompt 1', content: 'Content 1', type: 'positive', tags: [] },
        { _id: '2', title: 'Prompt 2', content: 'Content 2', type: 'negative', tags: [] },
    ] as any[]

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
        render(<PromptListView {...defaultProps} onShowSaveForm={onShowSaveForm} />)

        // There are two "plus" buttons potentially (one in header tooltip, one in empty state).
        // Header one is always visible.
        const addButtons = screen.getAllByRole('button') // simplify, or find by icon
        // The header button has a TooltipTrigger.
        // Let's find by class or just find the one in the header?
        // Use a testid or specific look.
        // The one in the header is "Button variant='outline' size='icon'"

        // Let's use name if accessible, or just click all or specific.
        // The tooltip content is "Add new prompt"

        // We can hover to see tooltip? Or just click the button that triggers it.
        // Let's find by the SVG or the container structure.
        // Or simply `screen.getAllByRole('button')[X]` if we are lazy, but that's brittle.

        // Code: <TooltipTrigger asChild><Button ...><Plus .../></Button></TooltipTrigger>
        // We can just query by the icon or similar.

        // Let's rely on finding the button that contains the Plus icon in the header.

        const buttons = screen.getAllByRole('button')
        // There is the clear search button (if query), the add button...
        // Let's just mock onShowSaveForm and trigger the one in the header.
        // If we assign a testid it's easier, but I can't modify source unless I want to.
        // Let's assume the button with the tooltip "Add new prompt" is what we want.
        // RTL `getByRole('button', { name: /Add new prompt/i })` might work if aria-label is set or tooltip is associated. 
        // Radix tooltip doesn't auto-associate description sometimes without open.

        // Let's try relying on the order or class.
        // The one in header is usually first or second after search clear.

        // Actually, we can just click the button with the Plus icon.
        // Since I'm mocking logic, I can just click the button I see.
        // Let's assume we can find it.

        // If empty state is NOT active (default props prompts=[] but isLoading false => empty state IS active).
        // If empty state is active, there are 2 buttons. one top right, one in center.

        // Let's render with prompts so empty state button is gone.
        const { rerender } = render(<PromptListView {...defaultProps} prompts={mockPrompts} onShowSaveForm={onShowSaveForm} />)

        // now only header button. is `variant="outline" size="icon"`.
        // There isn't an accessible name on it by default without aria-label (it relies on tooltip).
        // This is a good finding for accessibility improvement later, but for now let's find it via CSS class or icon.
        // The Plus icon is rendered.

        const plusIcon = document.querySelector('.lucide-plus')
        // plusIcon parent is the button?
        // There might be multiple Plus icons if other things have it?

        // Let's just execute `fireEvent.click` on the element we find.
        // Or use `user.click`.

        // Finding the button:
        // container -> header div -> tooltip -> button.

        // I will trust that looking for `role="button"` and filtering by presence of SVG is feasible.

        const headerAddButton = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-plus'))
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
