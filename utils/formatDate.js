/**
 * Formats a date string to a consistent format (YYYY-MM-DD)
 * This prevents hydration errors by ensuring server and client render the same format
 */
export function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // Use a consistent format to avoid hydration errors
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Formats a date string to a more readable format (MMM DD, YYYY)
 * Only use this on client-side after hydration
 */
export function formatDateReadable(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

