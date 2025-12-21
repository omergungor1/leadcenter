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

/**
 * Formats a date string to show date and time
 * Returns format: "Jan 15, 2024 at 10:30 AM"
 */
export function formatDateTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${dateStr} at ${timeStr}`;
}

/**
 * Formats a date string to show only time in GMT+3 timezone (Turkey)
 * Returns format: "10:30" (24-hour format)
 */
export function formatTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // Convert to GMT+3 (Turkey timezone - Europe/Istanbul)
    const options = {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };

    return date.toLocaleTimeString('tr-TR', options);
}

/**
 * Formats a date string to show relative time in GMT+3 timezone (Turkey)
 * Returns format: "X dakika önce", "X saat önce", "X gün önce", etc.
 */
export function formatTimeAgo(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // Get current time
    const now = new Date();

    // Both dates are already in UTC internally, so direct comparison is correct
    // The difference calculation works correctly regardless of timezone
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) {
        return 'az önce';
    }

    if (diffInSeconds < 60) {
        return 'az önce';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'dakika' : 'dakika'} önce`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'saat' : 'saat'} önce`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} ${diffInDays === 1 ? 'gün' : 'gün'} önce`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? 'ay' : 'ay'} önce`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'yıl' : 'yıl'} önce`;
}

