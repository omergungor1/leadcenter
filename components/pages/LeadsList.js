'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Filter, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll, fetchById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function LeadsList({ favoritesOnly = false }) {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [leads, setLeads] = useState([]);
    const [leadGroups, setLeadGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({
        leadGroup: '',
        city: '',
        business_type: '',
    });
    const observerTarget = useRef(null);

    // Fetch user ID from users table
    useEffect(() => {
        const fetchUserId = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user:', error);
                    return;
                }

                if (data) {
                    setUserId(data.id);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchUserId();
    }, [user]);

    // Fetch lead groups for filter
    useEffect(() => {
        const fetchLeadGroups = async () => {
            if (!userId) return;

            try {
                const { data, error } = await fetchAll('lead_groups', '*', {
                    user_id: userId,
                    is_active: true,
                });

                if (error) {
                    console.error('Error fetching lead groups:', error);
                    return;
                }

                setLeadGroups(data || []);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchLeadGroups();
    }, [userId]);

    // Fetch leads with pagination
    const fetchLeads = useCallback(async (pageNum = 0, reset = false) => {
        if (!userId) return;

        if (reset) {
            setIsLoading(true);
            setPage(0);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // If lead group filter is active, first get lead IDs from that group
            let leadIds = null;
            let totalCount = null;
            if (filters.leadGroup) {
                const { data: groupMapData, error: groupMapError } = await supabase
                    .from('lead_groups_map')
                    .select('lead_id')
                    .eq('lead_group_id', filters.leadGroup);

                if (groupMapError) {
                    console.error('Error fetching lead group map:', groupMapError);
                    toast.error('Error loading lead group');
                    setIsLoading(false);
                    setIsLoadingMore(false);
                    return;
                }

                if (groupMapData && groupMapData.length > 0) {
                    leadIds = groupMapData.map((gm) => gm.lead_id);
                } else {
                    // No leads in this group, return empty
                    if (reset) {
                        setLeads([]);
                    }
                    setHasMore(false);
                    setIsLoading(false);
                    setIsLoadingMore(false);
                    return;
                }
            }

            // Build base query for count
            let countQuery = supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_active', true);

            // Build base query for data
            let dataQuery = supabase
                .from('leads')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            // Apply favorites filter if favoritesOnly is true
            if (favoritesOnly) {
                countQuery = countQuery.eq('is_favorite', true);
                dataQuery = dataQuery.eq('is_favorite', true);
            }

            // Apply lead group filter (only if not favoritesOnly)
            if (!favoritesOnly && leadIds && leadIds.length > 0) {
                countQuery = countQuery.in('id', leadIds);
                dataQuery = dataQuery.in('id', leadIds);
            }

            // Apply other filters
            if (filters.city) {
                countQuery = countQuery.eq('city', filters.city);
                dataQuery = dataQuery.eq('city', filters.city);
            }
            if (filters.business_type) {
                countQuery = countQuery.eq('business_type', filters.business_type);
                dataQuery = dataQuery.eq('business_type', filters.business_type);
            }

            // Get total count
            const { count: totalCountResult } = await countQuery;
            totalCount = totalCountResult || 0;

            // Apply pagination to data query
            dataQuery = dataQuery.range(from, to);

            const { data, error } = await dataQuery;

            if (error) {
                toast.error('Error loading leads: ' + error.message);
                return;
            }

            // Get lead groups for each lead
            if (data && data.length > 0) {
                const leadsWithGroups = await Promise.all(
                    data.map(async (lead) => {
                        // Get primary group
                        let primaryGroup = null;
                        if (lead.primary_group_id) {
                            const { data: groupData } = await fetchById(
                                'lead_groups',
                                lead.primary_group_id
                            );
                            primaryGroup = groupData;
                        }

                        // Get all groups for this lead
                        const { data: groupMapData } = await fetchAll('lead_groups_map', '*', {
                            lead_id: lead.id,
                        });

                        if (groupMapData && groupMapData.length > 0) {
                            const groupIds = groupMapData.map((gm) => gm.lead_group_id);

                            // Fetch groups using fetchAll with array filter
                            const { data: groupsData } = await fetchAll('lead_groups', '*', {
                                id: groupIds,
                            });

                            return {
                                ...lead,
                                primaryGroup,
                                groups: groupsData || [],
                            };
                        }

                        return {
                            ...lead,
                            primaryGroup,
                            groups: [],
                        };
                    })
                );

                if (reset) {
                    setLeads(leadsWithGroups);
                } else {
                    // Filter out duplicates by checking existing lead IDs
                    setLeads((prev) => {
                        const existingIds = new Set(prev.map((lead) => lead.id));
                        const newLeads = leadsWithGroups.filter((lead) => !existingIds.has(lead.id));
                        return [...prev, ...newLeads];
                    });
                }

                // Check if there are more leads
                const totalFetched = (pageNum + 1) * PAGE_SIZE;
                setHasMore(totalFetched < (totalCount || 0));
            } else {
                if (reset) {
                    setLeads([]);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while loading leads');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [userId, filters.city, filters.business_type, filters.leadGroup, favoritesOnly]);

    // Initial load and filter changes
    useEffect(() => {
        fetchLeads(0, true);
    }, [userId, filters.city, filters.business_type, filters.leadGroup]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchLeads(nextPage, false);
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, isLoadingMore, isLoading, page, fetchLeads]);

    // Get unique cities and business types from all leads (for filter dropdowns)
    // We'll fetch a sample to populate filters, or use a separate query
    const [uniqueCities, setUniqueCities] = useState([]);
    const [uniqueBusinessTypes, setUniqueBusinessTypes] = useState([]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            if (!userId) return;

            try {
                let query = supabase
                    .from('leads')
                    .select('city, business_type')
                    .eq('user_id', userId)
                    .eq('is_active', true);

                // If favoritesOnly, only get filter options from favorite leads
                if (favoritesOnly) {
                    query = query.eq('is_favorite', true);
                }

                const { data, error } = await query;

                if (!error && data) {
                    const cities = [...new Set(data.map((lead) => lead.city).filter(Boolean))];
                    const types = [...new Set(data.map((lead) => lead.business_type).filter(Boolean))];
                    setUniqueCities(cities);
                    setUniqueBusinessTypes(types);
                }
            } catch (error) {
                console.error('Error fetching filter options:', error);
            }
        };

        fetchFilterOptions();
    }, [userId, favoritesOnly]);

    if (authLoading || isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">
                {favoritesOnly ? 'Favorites' : 'Leads'}
            </h1>

            {/* Filters */}
            {!favoritesOnly && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-slate-500" />
                        <span className="font-medium text-slate-700">Filters</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                            value={filters.leadGroup}
                            onChange={(e) => setFilters({ ...filters, leadGroup: e.target.value })}
                            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Lead Groups</option>
                            {leadGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.city}
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Cities</option>
                            {uniqueCities.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.business_type}
                            onChange={(e) => setFilters({ ...filters, business_type: e.target.value })}
                            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Categories</option>
                            {uniqueBusinessTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setFilters({ leadGroup: '', city: '', business_type: '' })}
                            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-1/4">
                                    Company Name
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-1/6">
                                    Category
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-1/6">
                                    Phone
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-1/6">
                                    City / District
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-1/6">
                                    Source Group
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-1/6">
                                    Last Activity
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase w-20">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {leads.map((lead, index) => {
                                const companyName = lead.company || lead.name || '';
                                const truncatedName = companyName.length > 50
                                    ? companyName.substring(0, 40) + '...'
                                    : companyName;

                                return (
                                    <tr key={`${lead.id}-${index}`} className="hover:bg-slate-50 cursor-pointer">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="text-xs font-medium text-slate-800 hover:text-blue-600 truncate block"
                                                title={companyName}
                                            >
                                                {truncatedName}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-600 whitespace-nowrap truncate">
                                            {lead.business_type || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-600 whitespace-nowrap">
                                            {lead.phone ? formatPhoneNumber(lead.phone) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-600 whitespace-nowrap truncate">
                                            {lead.city || '-'} {lead.district ? `/ ${lead.district}` : ''}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-600 whitespace-nowrap truncate">
                                            {lead.primaryGroup?.name || lead.groups?.[0]?.name || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-500 whitespace-nowrap">
                                            {lead.updated_at ? formatDate(lead.updated_at) : formatDate(lead.created_at)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <Eye size={14} />
                                                <span>View</span>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Loading indicator at the bottom */}
                            {isLoadingMore && (
                                <tr>
                                    <td colSpan="7" className="px-3 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-500">
                                            <Loader2 size={18} className="animate-spin" />
                                            <span className="text-xs">Loading more leads...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {/* Observer target for infinite scroll */}
                            {hasMore && !isLoadingMore && (
                                <tr ref={observerTarget}>
                                    <td colSpan="7" className="h-1"></td>
                                </tr>
                            )}
                            {/* End of list message */}
                            {!hasMore && leads.length > 0 && (
                                <tr>
                                    <td colSpan="7" className="px-3 py-3 text-center text-slate-500 text-xs">
                                        No more leads to load
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

