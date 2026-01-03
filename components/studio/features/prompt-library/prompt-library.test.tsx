
import type { UsePromptLibraryReturn } from '@/hooks/use-prompt-library'
import * as usePromptLibraryHook from '@/hooks/use-prompt-library'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PromptLibrary } from './prompt-library'

// Mock the hook
vi.mock('@/hooks/use-prompt-library', () => ({
    usePromptLibrary: vi.fn()
}))

// Mock child components
vi.mock('./prompt-list-view', () => ({
    PromptListView: (props: any) => <div data-testid="prompt-list-view">Prompt List View</div>
}))
vi.mock('./save-prompt-form', () => ({
    SavePromptForm: (props: any) => <div data-testid="save-prompt-form" data-initial-content={props.initialContent}>Save Prompt Form</div>
}))
vi.mock('./prompt-detail', () => ({
    PromptDetail: (props: any) => <div data-testid="prompt-detail">Prompt Detail View</div>
}))

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open, onOpenChange }: any) => (
        <div data-testid="dialog" data-state={open ? 'open' : 'closed'}>
            {open ? children : null}
        </div>
    ),
    DialogOverlay: () => <div data-testid="dialog-overlay" />,
    DialogPortal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
    DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}))

// Mock Radix Dialog Primitives
vi.mock('@radix-ui/react-dialog', () => ({
    Content: ({ children, asChild, ...props }: any) => (
        <div data-testid="radix-content" {...props}>
            {children}
        </div>
    ),
    Close: ({ children, ...props }: any) => (
        <button data-testid="radix-close" {...props}>
            {children}
        </button>
    ),
    // Add other primitives if the component uses them as * as DialogPrimitive
    Root: ({ children }: any) => <div data-testid="radix-root">{children}</div>,
    Portal: ({ children }: any) => <div data-testid="radix-portal">{children}</div>,
    Overlay: () => <div data-testid="radix-overlay" />,
    Trigger: ({ children }: any) => <button>{children}</button>,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => <>{children}</>,
    LayoutGroup: ({ children }: any) => <>{children}</>,
    motion: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        div: ({ children, layout, initial, animate, exit, variants, transition, ...props }: any) => <div {...props}>{children}</div>
    }
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Library: () => <div data-testid="library-icon" />,
    X: () => <div data-testid="x-icon" />
}))

describe('PromptLibrary Component', () => {
    const defaultMockReturn: UsePromptLibraryReturn = {
        searchQuery: '',
        setSearchQuery: vi.fn(),
        searchInputRef: { current: null },
        viewState: 'list',
        setViewState: vi.fn(),
        selectedPrompt: null,
        selectPrompt: vi.fn(),
        typeFilter: 'all',
        setTypeFilter: vi.fn(),
        prompts: [],
        isLoading: false,
        handleCopy: vi.fn(),
        handleInsert: vi.fn(),
        handleRemove: vi.fn(),
        showSaveForm: vi.fn(),
        goBackToList: vi.fn(),
    }

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        promptType: 'positive' as const,
        onInsert: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the list view by default', () => {
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(defaultMockReturn)

        render(<PromptLibrary {...defaultProps} />)

        expect(screen.getByTestId('dialog')).toHaveAttribute('data-state', 'open')
        // Header title is no longer in the wrapper
        expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument()
        expect(screen.queryByTestId('save-prompt-form')).not.toBeInTheDocument()
        expect(screen.queryByTestId('prompt-detail')).not.toBeInTheDocument()
    })

    it('renders the save form when viewState is "save-form"', () => {
        const mockReturn = { ...defaultMockReturn, viewState: 'save-form' as const }
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(mockReturn)

        render(<PromptLibrary {...defaultProps} />)

        expect(screen.getByTestId('save-prompt-form')).toBeInTheDocument()
        expect(screen.queryByTestId('prompt-list-view')).not.toBeInTheDocument()
    })

    it('renders the detail view when viewState is "detail" and a prompt is selected', () => {
        const selectedPrompt = {
            _id: '123' as any,
            title: 'Test Prompt',
            content: 'Test Content',
            description: 'Test Description',
        type: 'positive' as const,
            tags: [],
            category: 'Test',
            userId: 'user1',
            createdAt: Date.now(),
        }
        const mockReturn = {
            ...defaultMockReturn,
            viewState: 'detail' as const,
            selectedPrompt
        }
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(mockReturn)

        render(<PromptLibrary {...defaultProps} />)

        expect(screen.getByTestId('prompt-detail')).toBeInTheDocument()
        expect(screen.queryByTestId('prompt-list-view')).not.toBeInTheDocument()
    })

    it('renders the list view if viewState is "detail" but no prompt is selected', () => {
        const mockReturn = { ...defaultMockReturn, viewState: 'detail' as const, selectedPrompt: null }
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(mockReturn)

        render(<PromptLibrary {...defaultProps} />)

        expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument()
    })

    it('does not render dialog content when isOpen is false', () => {
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(defaultMockReturn)

        render(<PromptLibrary {...defaultProps} isOpen={false} />)

        const dialog = screen.getByTestId('dialog')
        expect(dialog).toHaveAttribute('data-state', 'closed')
        // Title check removed
    })

    it('passes initialSaveContent to SavePromptForm', () => {
        const mockReturn = { ...defaultMockReturn, viewState: 'save-form' as const }
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(mockReturn)

        const initialContent = "Start here"
        render(<PromptLibrary {...defaultProps} initialSaveContent={initialContent} />)

        const saveForm = screen.getByTestId('save-prompt-form')
        expect(saveForm).toHaveAttribute('data-initial-content', initialContent)
    })

    it('passes onInsertComplete to usePromptLibrary hook', () => {
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(defaultMockReturn)

        const onInsertComplete = vi.fn()
        render(<PromptLibrary {...defaultProps} onInsertComplete={onInsertComplete} />)

        // Verify the hook was called with onInsertComplete
        expect(usePromptLibraryHook.usePromptLibrary).toHaveBeenCalledWith(
            expect.objectContaining({
                onInsertComplete,
            })
        )
    })

    it('works without onInsertComplete (optional prop)', () => {
        vi.mocked(usePromptLibraryHook.usePromptLibrary).mockReturnValue(defaultMockReturn)

        // Should not throw when onInsertComplete is not provided
        expect(() => {
            render(<PromptLibrary {...defaultProps} />)
        }).not.toThrow()

        // Verify the hook was called without onInsertComplete (undefined)
        expect(usePromptLibraryHook.usePromptLibrary).toHaveBeenCalledWith(
            expect.objectContaining({
                onInsertComplete: undefined,
            })
        )
    })
})

