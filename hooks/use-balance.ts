/**
 * useBalance Hook
 *
 * Fetches the user's Pollinations balance (pending spend).
 * Returns the balance data along with loading and error states.
 */

/**
 * Balance response from Pollinations API.
 * Guessing property convention based on typical API patterns.
 */
export interface BalanceData {
    /** Pending spend amount in dollars */
    pendingSpend?: number
    /** Available balance/credits */
    balance?: number
    /** Currency code (e.g., "USD") */
    currency?: string
    /** Amount in cents (common pattern) */
    amountCents?: number
}


/**
 * Formats a balance value for display.
 * Handles various response formats from the API.
 */
export function formatBalance(data: BalanceData | null): string | null {
    if (!data) return null

    // Try different property conventions
    if (typeof data.pendingSpend === "number") {
        return `$${data.pendingSpend.toFixed(2)}`
    }
    
    if (typeof data.balance === "number") {
        return `$${data.balance.toFixed(2)}`
    }
    
    if (typeof data.amountCents === "number") {
        return `$${(data.amountCents / 100).toFixed(2)}`
    }

    return null
}
