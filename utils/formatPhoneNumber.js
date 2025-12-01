/**
 * Formats a phone number to Turkish format: (0543) 545 56 42
 * @param {string} phone - Phone number string (can contain digits, spaces, parentheses, etc.)
 * @returns {string} Formatted phone number: (XXXX) XXX XX XX
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Limit to 11 digits (Turkish phone number max length)
    const limitedDigits = digits.slice(0, 11);

    // Format: (XXXX) XXX XX XX
    if (limitedDigits.length === 0) return '';
    if (limitedDigits.length <= 4) {
        return `(${limitedDigits}`;
    } else if (limitedDigits.length <= 7) {
        return `(${limitedDigits.slice(0, 4)}) ${limitedDigits.slice(4)}`;
    } else if (limitedDigits.length <= 9) {
        return `(${limitedDigits.slice(0, 4)}) ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7)}`;
    } else {
        return `(${limitedDigits.slice(0, 4)}) ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7, 9)} ${limitedDigits.slice(9)}`;
    }
}

/**
 * Removes formatting from phone number to get only digits
 * @param {string} phone - Formatted phone number
 * @returns {string} Phone number with only digits
 */
export function unformatPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

/**
 * Validates Turkish phone number format
 * @param {string} phone - Phone number string
 * @returns {boolean} True if valid (10-11 digits)
 */
export function isValidPhoneNumber(phone) {
    const digits = unformatPhoneNumber(phone);
    return digits.length >= 10 && digits.length <= 11;
}

