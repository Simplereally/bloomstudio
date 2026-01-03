/**
 * Sets the value of a textarea/input element in a way that preserves
 * the browser's native undo stack (Ctrl+Z).
 *
 * This works by selecting all text and using execCommand to insert
 * the new text, which the browser treats as a user-initiated edit.
 *
 * @param element - The textarea or input element
 * @param newValue - The new value to set
 */
export function setInputValueWithUndo(
    element: HTMLTextAreaElement | HTMLInputElement,
    newValue: string
): void {
    // Save the currently focused element so we can restore it later
    // This prevents the undo operation from affecting the wrong element
    const previouslyFocusedElement = document.activeElement as HTMLElement | null

    // If element is disabled, focus() and execCommand won't work.
    // We temporarily enable it if needed.
    const wasDisabled = element.disabled
    if (wasDisabled) {
        element.disabled = false
    }

    // Focus the element first
    element.focus()

    // Select all existing text
    element.select()

    // Use execCommand to insert text - this registers with the browser's undo stack
    // Note: execCommand is deprecated but still widely supported and is the only
    // reliable way to insert text that works with Ctrl+Z
    try {
        const success = document.execCommand("insertText", false, newValue)

        if (!success) {
            // Fallback: Use value setter + InputEvent (won't support Undo but keeps React in sync)
            setValueFallback(element, newValue)
        }
    } catch (e) {
        console.error("Failed to set input value with undo:", e)
        setValueFallback(element, newValue)
    } finally {
        // Restore disabled state if we changed it
        if (wasDisabled) {
            element.disabled = true
        }

        // Restore focus to the previously focused element
        // This ensures the user's focus context is maintained and
        // Ctrl+Z will operate on the correct element
        if (previouslyFocusedElement && previouslyFocusedElement !== element) {
            // Use setTimeout to ensure the execCommand has fully completed
            // before we move focus back
            setTimeout(() => {
                previouslyFocusedElement.focus()
            }, 0)
        }
    }
}

function setValueFallback(
    element: HTMLTextAreaElement | HTMLInputElement,
    newValue: string
) {
    element.value = newValue
    const inputEvent = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: newValue,
    })
    element.dispatchEvent(inputEvent)
}
