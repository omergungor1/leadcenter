import { supabase } from './client';

/**
 * Upload a file to storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @param {File} file - File object
 * @param {Object} options - Upload options (cacheControl, contentType, etc.)
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function uploadFile(bucket, path, file, options = {}) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                ...options,
            });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Upload a file with overwrite (upsert)
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @param {File} file - File object
 * @param {Object} options - Upload options
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function uploadFileOverwrite(bucket, path, file, options = {}) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true,
                ...options,
            });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Get public URL for a file
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @returns {string} Public URL
 */
export function getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Get signed URL for a private file
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<{data: {signedUrl: string} | null, error: Error | null}>}
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Delete a file from storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function deleteFile(bucket, path) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Delete multiple files from storage
 * @param {string} bucket - Bucket name
 * @param {Array<string>} paths - Array of file paths
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function deleteFiles(bucket, paths) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove(paths);

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * List files in a bucket folder
 * @param {string} bucket - Bucket name
 * @param {string} folder - Folder path (optional)
 * @param {Object} options - List options (limit, offset, sortBy)
 * @returns {Promise<{data: Array | null, error: Error | null}>}
 */
export async function listFiles(bucket, folder = '', options = {}) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folder, {
                limit: options.limit || 100,
                offset: options.offset || 0,
                sortBy: options.sortBy || { column: 'name', order: 'asc' },
            });

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Download a file from storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path in bucket
 * @returns {Promise<{data: Blob | null, error: Error | null}>}
 */
export async function downloadFile(bucket, path) {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

