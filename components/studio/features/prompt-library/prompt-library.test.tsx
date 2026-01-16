import type { UsePromptLibraryReturn } from '@/hooks/use-prompt-library'
import * as usePromptLibraryHook from '@/hooks/use-prompt-library'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PromptLibrary } from './prompt-library'
import type { PromptListViewProps } from './prompt-list-view'
import type { SavePromptFormProps } from './save-prompt-form'
import type { PromptDetailProps } from './prompt-detail'
import type { Id } from '@/convex/_generated/dataModel'
import type { Prompt } from './types'
import * as React from "react"

// Mock the hook
vi.mock('@/hooks/use-prompt-library', () => ({
    usePromptLibrary: vi.fn()
}))

// Mock child components
vi.mock('./prompt-list-view', () => ({
    PromptListView: (_props: PromptListViewProps) => <div data-testid="prompt-list-view">Prompt List View</div>
}))
vi.mock('./save-prompt-form', () => ({
    SavePromptForm: (props: SavePromptFormProps) => <div data-testid="save-prompt-form" data-initial-content={props.initialContent}>Save Prompt Form</div>
}))
vi.mock('./prompt-detail', () => ({
    PromptDetail: (_props: PromptDetailProps) => <div data-testid="prompt-detail">Prompt Detail View</div>
}))

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: { children: React.ReactNode; open: boolean; onOpenChange?: (open: boolean) => void }) => (
        <div data-testid="dialog" data-state={open ? 'open' : 'closed'}>
            {open ? children : null}
        </div>
    ),
    DialogOverlay: () => <div data-testid="dialog-overlay" />,
    DialogPortal: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-portal">{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-title">{children}</div>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-description">{children}</div>,
}))

// Mock Radix Dialog Primitives
vi.mock('@radix-ui/react-dialog', () => ({
    Content: ({
        children,
        asChild: _asChild,
        ...props
    }: React.PropsWithChildren<{ asChild?: boolean }> & React.HTMLAttributes<HTMLDivElement>) => (
        <div data-testid="radix-content" {...props}>
            {children}
        </div>
    ),
    Close: ({
        children,
        ...props
    }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
        <button data-testid="radix-close" {...props}>
            {children}
        </button>
    ),
    // Add other primitives if the component uses them as * as DialogPrimitive
    Root: ({ children }: { children: React.ReactNode }) => <div data-testid="radix-root">{children}</div>,
    Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="radix-portal">{children}</div>,
    Overlay: () => <div data-testid="radix-overlay" />,
    Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({
            children,
            layout: _layout,
            initial: _initial,
            animate: _animate,
            exit: _exit,
            variants: _variants,
            transition: _transition,
            ...props
        }: React.PropsWithChildren<
            React.HTMLAttributes<HTMLDivElement> & {
                layout?: unknown
                initial?: unknown
                animate?: unknown
                exit?: unknown
                variants?: unknown
                transition?: unknown
            }
        >) => <div {...props}>{children}</div>
    }
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Library: () => <div data-testid="library-icon" />,
    X: () => <div data-testid="x-icon" />
}))

describe('PromptLibrary Component', () => {
    function createPromptId(value: string): Id<"prompts"> {
        return value as unknown as Id<"prompts">
    }

    const defaultMockReturn: UsePromptLibraryReturn = {
        searchQuery: '',
        setSearchQuery: vi.fn(),
        searchInputRef: React.createRef<HTMLInputElement>(),
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
        const selectedPrompt: Prompt = {
            _id: createPromptId('123'),
            title: 'Test Prompt',
            content: 'Test Content',
            type: 'positive',
            tags: [],
            category: 'Test',
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

