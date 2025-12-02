import { supabase } from './client';

/**
 * Generic function to fetch all records from a table
 * @param {string} table - Table name
 * @param {string} select - Columns to select (default: '*')
 * @param {Object} filters - Optional filters object
 * @returns {Promise<{data: Array | null, error: Error | null}>}
 */
export async function fetchAll(table, select = '*', filters = {}) {
    try {
        let query = supabase.from(table).select(select);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    query = query.in(key, value);
                } else {
                    query = query.eq(key, value);
                }
            }
        });

        const { data, error } = await query;
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Fetch a single record by ID
 * @param {string} table - Table name
 * @param {string|number} id - Record ID
 * @param {string} select - Columns to select (default: '*')
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function fetchById(table, id, select = '*') {
    try {
        const { data, error } = await supabase
            .from(table)
            .select(select)
            .eq('id', id)
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Insert a new record
 * @param {string} table - Table name
 * @param {Object} record - Record data
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function insert(table, record) {
    try {
        const { data, error } = await supabase
            .from(table)
            .insert(record)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Insert multiple records
 * @param {string} table - Table name
 * @param {Array} records - Array of record data
 * @returns {Promise<{data: Array | null, error: Error | null}>}
 */
export async function insertMany(table, records) {
    try {
        const { data, error } = await supabase
            .from(table)
            .insert(records)
            .select();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Update a record by ID
 * @param {string} table - Table name
 * @param {string|number} id - Record ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function updateById(table, id, updates) {
    try {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Delete a record by ID
 * @param {string} table - Table name
 * @param {string|number} id - Record ID
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function deleteById(table, id) {
    try {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Delete multiple records by IDs
 * @param {string} table - Table name
 * @param {Array} ids - Array of IDs
 * @returns {Promise<{data: Array | null, error: Error | null}>}
 */
export async function deleteMany(table, ids) {
    try {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .in('id', ids)
            .select();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Execute a custom query
 * @param {Function} queryBuilder - Query builder function
 * @returns {Promise<{data: any, error: Error | null}>}
 */
export async function executeQuery(queryBuilder) {
    try {
        const query = queryBuilder(supabase);
        const { data, error } = await query;
        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

