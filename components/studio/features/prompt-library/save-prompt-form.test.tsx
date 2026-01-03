import * as usePromptLibraryFormHook from '@/hooks/use-prompt-library-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SavePromptForm } from './save-prompt-form'

// Mock the hook
vi.mock('@/hooks/use-prompt-library-form', () => ({
    usePromptLibraryForm: vi.fn(),
}))

// Mock react-select/creatable
vi.mock('react-select/creatable', () => ({
    default: ({ options, value, onChange, placeholder, inputId }: any) => (
        <div data-testid="mock-creatable">
            <label htmlFor={inputId}>{placeholder}</label>
            <select
                data-testid="creatable-select"
                value={value?.value || ''}
                onChange={(e) => onChange({ value: e.target.value, label: e.target.value })}
            >
                <option value="">Select...</option>
                {options?.map((opt: any) => (
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
    const defaultMockReturn = {
        titleRef: { current: null },
        contentRef: { current: null },
        tagsRef: { current: null },
        type: 'positive' as const,
        setType: vi.fn(),
        category: null as string | null,
        setCategory: vi.fn(),
        categories: ['Category1', 'Category2'],
        handleSave: vi.fn(),
        isSaving: false,
        reset: vi.fn(),
    }

    const defaultProps = {
        promptType: 'text' as any, // The prop type in component is PromptType ('positive' | 'negative' usually, looking at file it seems saving logic handles it)
        // Wait, SavePromptFormProps has promptType: PromptType. PromptType is 'positive' | 'negative' from types.ts relative import, 
        // but in save-prompt-form.tsx lines 114/124 it sets 'positive'/'negative'.
        // Let's assume 'positive' as default for test.
        onSaved: vi.fn(),
        onCancel: vi.fn(),
    } as const

    beforeEach(() => {
        vi.clearAllMocks()
    })

    function renderWithHookReturn(mockReturn: Partial<typeof defaultMockReturn> = {}) {
        const finalMock = { ...defaultMockReturn, ...mockReturn }
        // We need to handle refs being assigned by React
        // Since we are mocking the hook, the component will use the refs returned by the hook.
        // But the component *passes* these refs to elements.
        // We can make the mock return real refs so we can inspect them or interactions work?
        // Actually, for userEvent to work on inputs, the inputs need to be in DOM. 
        // The component uses the refs from the hook. If we return { current: null } constantly, 
        // the component might not be able to interact with them if it relies on them for internal logic? 
        // Wait, the hook uses refs to *read* values on save. The component passes the ref object to <Input ref={titleRef} />.
        // React will update titleRef.current. So passing a real createRef() or logic is safer.

        // Let's update the mock to use real refs (created inside the test render isn't enough, needs to be stable object).
        // Best approach: The mock factory returns a stable object, or we modify the mock implementation per test.

        // Actually, if we mock the hook to return specific refs, React will populate them when rendering.
        // We can just create them in the test.

        const titleRef = { current: null }
        const contentRef = { current: null }
        const tagsRef = { current: null }

        ;(usePromptLibraryFormHook.usePromptLibraryForm as Mock).mockReturnValue({
            ...finalMock,
            titleRef: titleRef as any,
            contentRef: contentRef as any,
            tagsRef: tagsRef as any
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

        ;(usePromptLibraryFormHook.usePromptLibraryForm as Mock).mockReturnValue(defaultMockReturn as any)
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
