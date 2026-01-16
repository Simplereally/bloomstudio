import * as usePromptLibraryFormHook from '@/hooks/use-prompt-library-form'
import type { UsePromptLibraryFormReturn } from '@/hooks/use-prompt-library-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SavePromptForm } from './save-prompt-form'
import type { CategoryOption, PromptType } from './types'
import * as React from "react"

// Mock the hook
vi.mock('@/hooks/use-prompt-library-form', () => ({
    usePromptLibraryForm: vi.fn(),
}))

// Mock react-select/creatable
vi.mock('react-select/creatable', () => ({
    default: ({ options, value, onChange, placeholder, inputId }: {
        options?: CategoryOption[]
        value?: CategoryOption | null
        onChange: (nextValue: CategoryOption | null) => void
        placeholder?: string
        inputId?: string
    }) => (
        <div data-testid="mock-creatable">
            <label htmlFor={inputId}>{placeholder}</label>
            <select
                data-testid="creatable-select"
                value={value?.value || ''}
                onChange={(e) => onChange({ value: e.target.value, label: e.target.value })}
            >
                <option value="">Select...</option>
                {options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    ),
}))

vi.mock('./prompt-library-header', () => ({
    PromptLibraryHeader: () => <div data-testid="prompt-library-header">Header</div>
}))

describe('SavePromptForm', () => {
    const defaultMockReturn: UsePromptLibraryFormReturn = {
        titleRef: React.createRef<HTMLInputElement>(),
        contentRef: React.createRef<HTMLTextAreaElement>(),
        tagsRef: React.createRef<HTMLInputElement>(),
        type: 'positive',
        setType: vi.fn(),
        category: null,
        setCategory: vi.fn(),
        categories: ['Category1', 'Category2'],
        handleSave: vi.fn(),
        isSaving: false,
        reset: vi.fn(),
    }

    const defaultProps: { promptType: PromptType; onSaved: () => void; onCancel: () => void } = {
        promptType: 'positive',
        onSaved: vi.fn(),
        onCancel: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    function renderWithHookReturn(mockReturn: Partial<UsePromptLibraryFormReturn> = {}) {
        const titleRef = React.createRef<HTMLInputElement>()
        const contentRef = React.createRef<HTMLTextAreaElement>()
        const tagsRef = React.createRef<HTMLInputElement>()

        ;(usePromptLibraryFormHook.usePromptLibraryForm as Mock).mockReturnValue({
            ...defaultMockReturn,
            ...mockReturn,
            titleRef,
            contentRef,
            tagsRef,
        })

        return {
            user: userEvent.setup(),
            ...render(<SavePromptForm {...defaultProps} promptType="positive" />)
        }
    }

    it('renders all form fields correctly', () => {
        renderWithHookReturn()

        expect(screen.getByLabelText(/Prompt Title/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Prompt Content/i)).toBeInTheDocument()
        expect(screen.getByText('Positive')).toBeInTheDocument()
        expect(screen.getByText('Negative')).toBeInTheDocument()
        expect(screen.getByTestId('mock-creatable')).toBeInTheDocument()
        expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Save to Library/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument() // "Back to library" or "Cancel"
    })

    it('displays initial content when provided', () => {
        const initialContent = 'My awesome prompt'

        // The component passes initialContent to Textarea normally.
        // BUT logic: The hook handles initialContent population into the ref/value?
        // Looking at SavePromptForm code Line 103: defaultValue={initialContent ?? ""}
        // So it should be in the DOM.

        ;(usePromptLibraryFormHook.usePromptLibraryForm as Mock).mockReturnValue(defaultMockReturn)
        render(<SavePromptForm {...defaultProps} promptType="positive" initialContent={initialContent} />)

        expect(screen.getByRole('textbox', { name: /Prompt Content/i })).toHaveValue(initialContent)
    })

    it('calls setType when type cards are clicked', async () => {
        const setType = vi.fn()
        const { user } = renderWithHookReturn({ setType })

        // Click Negative
        await user.click(screen.getByText('Negative'))
        expect(setType).toHaveBeenCalledWith('negative')

        // Click Positive
        await user.click(screen.getByText('Positive'))
        expect(setType).toHaveBeenCalledWith('positive')
    })

    it('calls handleSave when save button is clicked', async () => {
        const handleSave = vi.fn()
        const { user } = renderWithHookReturn({ handleSave })

        await user.click(screen.getByRole('button', { name: /Save to Library/i }))
        expect(handleSave).toHaveBeenCalled()
    })

    it('calls onCancel when cancel/back button is clicked', async () => {
        const { user } = renderWithHookReturn()

        await user.click(screen.getByText('Cancel'))
        expect(defaultProps.onCancel).toHaveBeenCalled()

        vi.clearAllMocks()
        await user.click(screen.getByText('Back to library'))
        expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('shows loading state when isSaving is true', () => {
        renderWithHookReturn({ isSaving: true })

        expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled()
        expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('passes category to creatable select', () => {
        const setCategory = vi.fn()
        const category = 'Art'
        // Add 'Art' to categories so it appears in the mocked <select> options
        renderWithHookReturn({ category, setCategory, categories: ['Art', 'Other'] })

        const select = screen.getByTestId('creatable-select') as HTMLSelectElement
        expect(select.value).toBe('Art')
    })
})
