import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// ============================================================================
// In-memory localStorage mock
// ============================================================================
// jsdom may provide a `window.localStorage` object whose methods are not real
// functions (depending on the vitest/jsdom version and Node flags). This
// in-memory implementation guarantees that `getItem`, `setItem`, `removeItem`,
// and `clear` are always callable, preventing the ubiquitous
// "window.localStorage.getItem is not a function" errors across all tests.

function createLocalStorageMock(): Storage {
    let store: Record<string, string> = {}
    return {
        getItem(key: string) { return store[key] ?? null },
        setItem(key: string, value: string) { store[key] = String(value) },
        removeItem(key: string) { delete store[key] },
        clear() { store = {} },
        get length() { return Object.keys(store).length },
        key(index: number) { return Object.keys(store)[index] ?? null },
    }
}

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: createLocalStorageMock(),
        writable: true,
        configurable: true,
    })
}

// Cleanup after each test
afterEach(() => {
    cleanup()
    // Clear localStorage between tests to prevent cross-test state contamination.
    // Hooks like useLocalStorage and usePromptInput persist values that can leak
    // between tests and cause non-deterministic failures.
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.clear === 'function') {
        window.localStorage.clear()
    }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mock = vi.fn() as any
            mock.withOptimisticUpdate = vi.fn().mockReturnValue(mock)
            return mock
        }),
        useAction: vi.fn(),
        usePaginatedQuery: vi.fn(() => ({
            results: [],
            status: 'CanLoadMore',
            loadMore: vi.fn(),
        })),
        ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
    }
})
