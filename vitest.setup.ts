import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Only set up browser mocks when window is available (jsdom environment)
if (typeof window !== 'undefined') {
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { },
            removeListener: () => { },
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false,
        }),
    })
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() { }
    unobserve() { }
    disconnect() { }
    root = null
    rootMargin = ''
    thresholds = []
    takeRecords() { return [] }
}

// Global Convex Mock
vi.mock('convex/react', async (importOriginal) => {
    const original = await importOriginal<typeof import('convex/react')>()
    return {
        ...original,
        useQuery: vi.fn(),
        useMutation: vi.fn(() => {
            const mock = vi.fn() as any
            mock.withOptimisticUpdate = vi.fn().mockReturnValue(mock)
            return mock
        }),
        usePaginatedQuery: vi.fn(() => ({
            results: [],
            status: 'CanLoadMore',
            loadMore: vi.fn(),
        })),
        ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
    }
})
