/**
 * Formats a phone number to Turkish format: 0543 545 56 42
 * @param {string} phone - Phone number string (can contain digits, spaces, parentheses, etc.)
 * @returns {string} Formatted phone number: 0XXX XXX XX XX
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';

    console.log('[formatPhoneNumber] Input:', phone, 'Input length:', phone.length);

    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    console.log('[formatPhoneNumber] After removing non-digits:', digits, 'Length:', digits.length);

    // If starts with 90 or 9, remove the leading digits
    // Turkish phone numbers should start with 0, not 9
    // Handle both 11-digit (9XXXXXXXXXX) and 12-digit (90XXXXXXXXXX) formats
    if (digits.startsWith('90') && digits.length >= 12) {
        console.log('[formatPhoneNumber] Starts with 90 and length >= 12, removing first 2 digits');
        digits = digits.slice(2);
        console.log('[formatPhoneNumber] After removing 90:', digits, 'Length:', digits.length);
        // If it doesn't start with 0, add 0 at the beginning
        if (!digits.startsWith('0')) {
            digits = '0' + digits;
            console.log('[formatPhoneNumber] Added 0 at beginning:', digits, 'Length:', digits.length);
        }
    } else if (digits.startsWith('9')) {
        console.log('[formatPhoneNumber] Starts with 9, checking length:', digits.length);

        // If 11 digits starting with 9, remove the 9 (9XXXXXXXXXX -> 0XXXXXXXXX)
        if (digits.length === 11) {
            console.log('[formatPhoneNumber] 11 digits starting with 9, removing first 9');
            digits = digits.slice(1);
            // If it doesn't start with 0, add 0 at the beginning
            if (!digits.startsWith('0')) {
                digits = '0' + digits;
            }
        } else if (digits.length > 11) {
            // If more than 11, try to remove leading 9
            console.log('[formatPhoneNumber] More than 11 digits starting with 9, removing first digit');
            digits = digits.slice(1);
            // If it doesn't start with 0, add 0 at the beginning
            if (!digits.startsWith('0')) {
                digits = '0' + digits;
            }
        }

        console.log('[formatPhoneNumber] After removing 9:', digits, 'Length:', digits.length);
    }

    // If the number doesn't start with 0 and has 10 digits, add 0 at the beginning
    if (!digits.startsWith('0') && digits.length === 10) {
        console.log('[formatPhoneNumber] 10 digits without 0, adding 0 at beginning');
        digits = '0' + digits;
        console.log('[formatPhoneNumber] After adding 0:', digits, 'Length:', digits.length);
    }

    // Ensure we have 10 or 11 digits for Turkish phone number
    // If more than 11, slice to 11 (0 + 10 digits)
    if (digits.length > 11) {
        console.log('[formatPhoneNumber] More than 11 digits, slicing to 11');
        digits = digits.slice(0, 11);
        console.log('[formatPhoneNumber] After slicing:', digits, 'Length:', digits.length);
    }

    // Format: 0XXX XXX XX XX (4-3-2-2) for 11 digits, or 0XXX XXX XX X for 10 digits
    if (digits.length === 0) {
        console.log('[formatPhoneNumber] Empty digits, returning empty string');
        return '';
    }

    // If we have exactly 11 digits (0 + 10 digits), format properly as 0XXX XXX XX XX
    if (digits.length === 11) {
        const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
        console.log('[formatPhoneNumber] 11 digits - Formatted:', formatted);
        console.log('[formatPhoneNumber] Slices:', {
            '0-4': digits.slice(0, 4),
            '4-7': digits.slice(4, 7),
            '7-9': digits.slice(7, 9),
            '9-end': digits.slice(9)
        });
        return formatted;
    }

    // If we have exactly 10 digits, format properly as 0XXX XXX XX XX
    if (digits.length === 10) {
        const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
        console.log('[formatPhoneNumber] 10 digits - Formatted:', formatted);
        console.log('[formatPhoneNumber] Slices:', {
            '0-4': digits.slice(0, 4),
            '4-7': digits.slice(4, 7),
            '7-9': digits.slice(7, 9),
            '9-end': digits.slice(9)
        });
        return formatted;
    }

    // If less than 10 digits, try to format what we have (incomplete number)
    // This should not normally happen, but handle gracefully
    console.log('[formatPhoneNumber] Less than 10 digits:', digits.length);
    if (digits.length >= 7) {
        const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        console.log('[formatPhoneNumber] 7+ digits - Formatted:', formatted);
        return formatted;
    } else if (digits.length >= 4) {
        const formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
        console.log('[formatPhoneNumber] 4+ digits - Formatted:', formatted);
        return formatted;
    }

    console.log('[formatPhoneNumber] Returning raw digits:', digits);
    return digits;
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

