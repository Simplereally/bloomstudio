// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageLightbox } from './image-lightbox'

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
    TransformWrapper: ({ children, onTransformed }: any) => {
        // Simulate zoom callback availability if needed
        return <div>{children({ zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn(), state: { scale: 1 } })}</div>
    },
    TransformComponent: ({ children }: any) => <div data-testid="transform-component">{children}</div>
}))

// Mock React hooks that the component uses
const mockHandleInsert = vi.fn()

// Mock the usePromptLibrary hook to capture the onInsertComplete callback
let capturedOnInsertComplete: (() => void) | undefined

vi.mock('@/hooks/use-prompt-library', () => ({
    usePromptLibrary: (props: any) => {
        capturedOnInsertComplete = props.onInsertComplete
        return {
            searchQuery: '',
            setSearchQuery: vi.fn(),
            searchInputRef: { current: null },
            viewState: 'list',
            setViewState: vi.fn(),
            selectedPrompt: null,
            selectPrompt: vi.fn(),
            typeFilter: 'all',
            setTypeFilter: vi.fn(),
            prompts: [
                { _id: '1', title: 'Test Prompt', content: 'Test Content', type: 'positive', tags: [] }
            ],
            isLoading: false,
            handleCopy: vi.fn(),
            handleInsert: (content: string) => {
                mockHandleInsert(content)
                props.onInsert(content)
                props.onClose()
                props.onInsertComplete?.()
            },
            handleRemove: vi.fn(),
            showSaveForm: vi.fn(),
            goBackToList: vi.fn(),
        }
    }
}))

// Mock the useImageLightbox hook
vi.mock('@/hooks/use-image-lightbox', () => ({
    useImageLightbox: () => ({
        copied: false,
        isZoomed: false,
        toggleZoom: vi.fn(),
        handleCopyPrompt: vi.fn(),
        handleImageLoad: vi.fn(),
        canZoom: true,
        // Legacy/unused props that might be destructured
        naturalSize: { width: 1000, height: 1000 },
        isDragging: false,
        scrollContainerRef: { current: null },
        handleMouseDown: vi.fn(),
        handleMouseMove: vi.fn(),
        handleMouseUp: vi.fn(),
        handleMouseLeave: vi.fn(),
    })
}))

// Mock the image details query
vi.mock('@/hooks/queries/use-image-history', () => ({
    useImageDetails: () => null
}))

// Mock MediaPlayer
vi.mock('@/components/ui/media-player', () => ({
    MediaPlayer: ({ url, alt, contentType, onLoadedMetadata, onLoad }: any) => {
        const isVideo = contentType?.startsWith('video/') || url?.match(/\.(mp4|webm|mov)$/i);
        if (isVideo) {
            return <video src={url} aria-label={alt} data-testid="video-player" onLoadedMetadata={onLoadedMetadata} />;
        }
        return <img src={url} alt={alt} onLoad={onLoad} data-testid="image-player" />;
    },
    isVideoContent: (contentType: string, url: string) => contentType?.startsWith('video/') || url?.match(/\.(mp4|webm|mov)$/i)
}))

// Mock Next.js Image - not used anymore but keep for compatibility if needed
vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    }
}))

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogTitle: ({ children }: any) => <span>{children}</span>,
    DialogDescription: ({ children }: any) => <span>{children}</span>,
    DialogOverlay: () => <div data-testid="dialog-overlay" />,
    DialogPortal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
}))

// Mock Radix Dialog Primitives for PromptLibrary
vi.mock('@radix-ui/react-dialog', () => ({
    Content: ({ children }: any) => <div data-testid="radix-content">{children}</div>,
    Close: ({ children }: any) => <button data-testid="radix-close">{children}</button>,
    Root: ({ children }: any) => <div>{children}</div>,
    Portal: ({ children }: any) => <div data-testid="radix-portal">{children}</div>,
    Overlay: () => <div data-testid="radix-overlay" />,
}))

// Mock VisuallyHidden
vi.mock('@radix-ui/react-visually-hidden', () => ({
    VisuallyHidden: ({ children }: any) => <span className="sr-only">{children}</span>
}))

// Mock Tooltip components
vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <span>{children}</span>,
}))

// Mock Button
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    )
}))

// Mock the PromptLibrary's child components
vi.mock('@/components/studio/features/prompt-library/prompt-list-view', () => ({
    PromptListView: ({ onInsertPrompt, prompts }: any) => (
        <div data-testid="prompt-list-view">
            {prompts?.map((p: any) => (
                <button
                    key={p._id}
                    data-testid="insert-prompt-btn"
                    onClick={() => onInsertPrompt(p.content)}
                >
                    Insert: {p.title}
                </button>
            ))}
        </div>
    )
}))

vi.mock('@/components/studio/features/prompt-library/save-prompt-form', () => ({
    SavePromptForm: () => <div data-testid="save-prompt-form">Save Form</div>
}))

vi.mock('@/components/studio/features/prompt-library/prompt-detail', () => ({
    PromptDetail: () => <div data-testid="prompt-detail">Detail</div>
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    BookmarkPlus: () => <span data-testid="bookmark-icon">📥</span>,
    Check: () => <span>✓</span>,
    Copy: () => <span>📋</span>,
    Loader2: () => <span>⏳</span>,
    ZoomIn: () => <span>🔍</span>,
    X: () => <span>✕</span>,
}))

// Mock model config
vi.mock('@/lib/config/models', () => ({
    getModelDisplayName: (model: string) => model
}))

describe('ImageLightbox - Prompt Library Integration', () => {
    const mockImage = {
        url: 'https://example.com/test-image.jpg',
        prompt: 'A beautiful landscape',
        model: 'test-model',
        width: 1024,
        height: 1024,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        capturedOnInsertComplete = undefined
    })

    it('renders the lightbox with the image when open', () => {
        render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />)

        expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    it('shows the save to library button when prompt is available', () => {
        render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />)

        expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
    })

    it('opens the prompt library when save to library button is clicked', async () => {
        const user = userEvent.setup()
        render(<ImageLightbox image={mockImage} isOpen={true} onClose={vi.fn()} />)

        // Find and click the save to library button
        const saveButton = screen.getByTestId('bookmark-icon').closest('button')
        await user.click(saveButton!)

        // The prompt library should be open (showing prompt list view)
        await waitFor(() => {
            expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument()
        })
    })

    it('closes the lightbox when insert prompt is clicked from the library', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(<ImageLightbox image={mockImage} isOpen={true} onClose={onClose} />)

        // Open the library
        const saveButton = screen.getByTestId('bookmark-icon').closest('button')
        await user.click(saveButton!)

        // Wait for library to open
        await waitFor(() => {
            expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument()
        })

        // Click insert on a prompt
        const insertButton = screen.getByTestId('insert-prompt-btn')
        await user.click(insertButton)

        // The lightbox's onClose should have been called (via onInsertComplete)
        expect(onClose).toHaveBeenCalled()
    })

    it('passes onClose as onInsertComplete to PromptLibrary', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(<ImageLightbox image={mockImage} isOpen={true} onClose={onClose} />)

        // Open the library
        const saveButton = screen.getByTestId('bookmark-icon').closest('button')
        await user.click(saveButton!)

        // Verify the onInsertComplete callback was captured and is the onClose function
        // This tests that the prop is correctly wired
        await waitFor(() => {
            expect(capturedOnInsertComplete).toBeDefined()
        })

        // Invoking onInsertComplete should call onClose
        capturedOnInsertComplete?.()
        expect(onClose).toHaveBeenCalled()
    })

    describe('prompt insertion from lightbox', () => {
        it('should call onInsertPrompt with prompt content when insert is triggered', async () => {
            const user = userEvent.setup()
            const onInsertPrompt = vi.fn()

            render(
                <ImageLightbox
                    image={mockImage}
                    isOpen={true}
                    onClose={vi.fn()}
                    onInsertPrompt={onInsertPrompt}
                />
            )

            // Open the library by clicking the save to library button
            const saveButton = screen.getByTestId('bookmark-icon').closest('button')
            await user.click(saveButton!)

            // Wait for library to open
            await waitFor(() => {
                expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument()
            })

            // Click insert on a prompt
            const insertButton = screen.getByTestId('insert-prompt-btn')
            await user.click(insertButton)

            // The onInsertPrompt callback should be called with the inserted content
            expect(onInsertPrompt).toHaveBeenCalledWith('Test Content')
        })

        it('does not fail if onInsertPrompt is not provided', async () => {
            const user = userEvent.setup()

            // Render without onInsertPrompt - should not throw
            render(
                <ImageLightbox
                    image={mockImage}
                    isOpen={true}
                    onClose={vi.fn()}
                />
            )

            // Open the library
            const saveButton = screen.getByTestId('bookmark-icon').closest('button')
            await user.click(saveButton!)

            // Wait for library to open
            await waitFor(() => {
                expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument()
            })

            // Click insert - should not throw even without the callback
            const insertButton = screen.getByTestId('insert-prompt-btn')
            await expect(user.click(insertButton)).resolves.not.toThrow()
        })
    })

    describe('video support', () => {
        const mockVideo = {
            url: 'https://example.com/test-video.mp4',
            prompt: 'A beautiful video',
            model: 'veo',
            contentType: 'video/mp4'
        }

        it('renders a video player when content is video', () => {
            render(<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />)

            expect(screen.getByTestId('video-player')).toBeInTheDocument()
            expect(screen.getByTestId('video-player')).toHaveAttribute('src', mockVideo.url)
            expect(screen.queryByTestId('image-player')).not.toBeInTheDocument()
        })

        it('does not show zoom indicator for video content', () => {
            render(<ImageLightbox image={mockVideo} isOpen={true} onClose={vi.fn()} />)

            expect(screen.queryByTestId('zoom-indicator')).not.toBeInTheDocument()
            expect(screen.queryByText('🔍')).not.toBeInTheDocument()
        })
    })
})
