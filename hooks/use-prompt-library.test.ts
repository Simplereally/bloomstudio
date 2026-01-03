import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePromptLibrary } from './use-prompt-library'

// Mock Convex hooks
vi.mock('convex/react', () => ({
    useQuery: vi.fn(() => []),
    useMutation: vi.fn(() => vi.fn()),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

describe('usePromptLibrary', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        promptType: 'positive' as const,
        onInsert: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('handleInsert', () => {
        it('calls onInsert with the provided content', () => {
            const onInsert = vi.fn()
            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps, onInsert })
            )

            act(() => {
                result.current.handleInsert('Test prompt content')
            })

            expect(onInsert).toHaveBeenCalledWith('Test prompt content')
        })

        it('calls onClose after inserting', () => {
            const onClose = vi.fn()
            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps, onClose })
            )

            act(() => {
                result.current.handleInsert('Test prompt content')
            })

            expect(onClose).toHaveBeenCalled()
        })

        it('calls onInsertComplete after insert if provided', () => {
            const onInsertComplete = vi.fn()
            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps, onInsertComplete })
            )

            act(() => {
                result.current.handleInsert('Test prompt content')
            })

            expect(onInsertComplete).toHaveBeenCalled()
        })

        it('calls onInsertComplete after onClose', () => {
            const callOrder: string[] = []
            const onClose = vi.fn(() => callOrder.push('onClose'))
            const onInsertComplete = vi.fn(() => callOrder.push('onInsertComplete'))

            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps, onClose, onInsertComplete })
            )

            act(() => {
                result.current.handleInsert('Test prompt content')
            })

            // onInsertComplete should be called after onClose
            expect(callOrder).toEqual(['onClose', 'onInsertComplete'])
        })

        it('does not fail if onInsertComplete is not provided', () => {
            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps, onInsertComplete: undefined })
            )

            // Should not throw
            expect(() => {
                act(() => {
                    result.current.handleInsert('Test prompt content')
                })
            }).not.toThrow()
        })
    })

    describe('view state management', () => {
        it('starts with list view when no initial save content', () => {
            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps })
            )

            expect(result.current.viewState).toBe('list')
        })

        it('starts with save-form view when initial save content is provided', () => {
            const { result } = renderHook(() =>
                usePromptLibrary({ ...defaultProps, initialSaveContent: 'Some content' })
            )

            expect(result.current.viewState).toBe('save-form')
        })

        it('resets view state to list when modal closes', async () => {
            const { result, rerender } = renderHook(
                ({ isOpen }) => usePromptLibrary({ ...defaultProps, isOpen }),
                { initialProps: { isOpen: true } }
            )

            // Navigate to a different view
            act(() => {
                result.current.showSaveForm()
            })
            expect(result.current.viewState).toBe('save-form')

            // Close the modal
            rerender({ isOpen: false })

            await waitFor(() => {
                expect(result.current.viewState).toBe('list')
            })
        })
    })
})
