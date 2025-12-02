import { supabase } from './client';

/**
 * Get current authenticated user
 * @returns {Promise<{user: User | null, error: Error | null}>}
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    } catch (error) {
        return { user: null, error };
    }
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: User | null, session: Session | null, error: Error | null}>}
 */
export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { user: data?.user || null, session: data?.session || null, error };
    } catch (error) {
        return { user: null, session: null, error };
    }
}

/**
 * Sign up with email and password
 * @param {string} email
 * @param {string} password
 * @param {Object} metadata - Optional user metadata
 * @returns {Promise<{user: User | null, session: Session | null, error: Error | null}>}
 */
export async function signUpWithEmail(email, password, metadata = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        return { user: data?.user || null, session: data?.session || null, error };
    } catch (error) {
        return { user: null, session: null, error };
    }
}

/**
 * Sign out current user
 * @returns {Promise<{error: Error | null}>}
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        return { error };
    } catch (error) {
        return { error };
    }
}

/**
 * Reset password with email
 * @param {string} email
 * @param {string} redirectTo - Optional redirect URL (defaults to /auth/reset-password)
 * @returns {Promise<{error: Error | null}>}
 */
export async function resetPassword(email, redirectTo = null) {
    try {
        const redirectUrl = redirectTo || (typeof window !== 'undefined'
            ? `${window.location.origin}/auth/reset-password`
            : '/auth/reset-password');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });
        return { error };
    } catch (error) {
        return { error };
    }
}

/**
 * Update user password
 * @param {string} newPassword
 * @returns {Promise<{error: Error | null}>}
 */
export async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        return { error };
    } catch (error) {
        return { error };
    }
}

/**
 * Update user metadata
 * @param {Object} metadata
 * @returns {Promise<{user: User | null, error: Error | null}>}
 */
export async function updateUserMetadata(metadata) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: metadata,
        });
        return { user: data?.user || null, error };
    } catch (error) {
        return { user: null, error };
    }
}

/**
 * Listen to auth state changes
 * @param {Function} callback
 * @returns {{data: {subscription: {unsubscribe: Function}}}} Subscription object
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

