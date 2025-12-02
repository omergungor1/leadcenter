'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll, insert, insertMany } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CreateCampaign() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupIdFromQuery = searchParams.get('groupId');
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [leadGroups, setLeadGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        selectedLeadGroups: [],
        selectedLeads: [], // Array of lead objects {id, company, name, city, district}
        message: '',
        emailTitle: '',
        emailContent: '',
        note: '',
        startDate: '',
        endDate: '',
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);

    // Fetch user ID
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

    // Fetch lead groups
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                const { data: groupsData } = await fetchAll('lead_groups', '*', {
                    user_id: userId,
                });
                setLeadGroups(groupsData || []);
            } catch (error) {
                console.error('Error:', error);
                toast.error('Error loading data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    // Pre-select group if coming from lead group detail page
    useEffect(() => {
        if (groupIdFromQuery) {
            setFormData((prev) => ({
                ...prev,
                selectedLeadGroups: [groupIdFromQuery],
            }));
        }
    }, [groupIdFromQuery]);

    // Search leads with debounce
    const searchLeads = useCallback(
        async (query) => {
            if (!query.trim() || !userId) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, company, name, city, district, email, phone, business_type ')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .or(
                        `company.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%,district.ilike.%${query}%,business_type.ilike.%${query}%`
                    )
                    .limit(10);

                if (error) {
                    console.error('Error searching leads:', error);
                    return;
                }

                setSearchResults(data || []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsSearching(false);
            }
        },
        [userId]
    );

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchLeads(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchLeads]);

    // Validate form
    useEffect(() => {
        const hasName = formData.name.trim() !== '';
        const hasType = formData.type !== '';
        // Valid if at least one group OR at least one individual lead is selected
        const hasLeads = formData.selectedLeadGroups.length > 0 || formData.selectedLeads.length > 0;

        let hasContent = false;
        if (formData.type === 'whatsapp') {
            hasContent = formData.message.trim() !== '';
        } else if (formData.type === 'mail') {
            hasContent = formData.emailTitle.trim() !== '' && formData.emailContent.trim() !== '';
        } else if (formData.type === 'call' || formData.type === 'visit') {
            hasContent = formData.note.trim() !== '';
        }

        setIsFormValid(hasName && hasType && hasLeads && hasContent);
    }, [formData]);

    const toggleLeadGroup = (groupId) => {
        setFormData((prev) => ({
            ...prev,
            selectedLeadGroups: prev.selectedLeadGroups.includes(groupId)
                ? prev.selectedLeadGroups.filter((id) => id !== groupId)
                : [...prev.selectedLeadGroups, groupId],
        }));
    };

    const addLead = (lead) => {
        // Check if lead already added
        if (formData.selectedLeads.some((l) => l.id === lead.id)) {
            toast.info('Lead already added');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            selectedLeads: [...prev.selectedLeads, lead],
        }));

        // Clear search
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeLead = (leadId) => {
        setFormData((prev) => ({
            ...prev,
            selectedLeads: prev.selectedLeads.filter((l) => l.id !== leadId),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid || !userId || isSaving) return;

        setIsSaving(true);
        try {
            // Prepare campaign data
            const campaignType = formData.type.toLowerCase();
            let title = '';
            let content = '';

            if (campaignType === 'whatsapp') {
                content = formData.message;
            } else if (campaignType === 'mail') {
                title = formData.emailTitle;
                content = formData.emailContent;
            } else if (campaignType === 'call' || campaignType === 'visit') {
                content = formData.note;
            }

            // Calculate total leads
            let totalLeads = formData.selectedLeads.length; // Individual leads

            // Add leads from selected groups
            if (formData.selectedLeadGroups.length > 0) {
                for (const groupId of formData.selectedLeadGroups) {
                    const { count: groupCount } = await supabase
                        .from('lead_groups_map')
                        .select('*', { count: 'exact', head: true })
                        .eq('lead_group_id', groupId);

                    totalLeads += groupCount || 0;
                }
            }

            // 1. Create campaign with total_leads
            const { data: campaign, error: campaignError } = await insert('campaigns', {
                user_id: userId,
                name: formData.name,
                title: title || null,
                content: content,
                campaign_type: campaignType,
                status: 'draft',
                start_date: formData.startDate || null,
                end_date: formData.endDate || null,
                total_leads: totalLeads,
            });

            if (campaignError || !campaign) {
                toast.error('Error creating campaign: ' + (campaignError?.message || 'Unknown error'));
                return;
            }

            // 2. Create campaign_groups entries
            if (formData.selectedLeadGroups.length > 0) {
                const campaignGroups = formData.selectedLeadGroups.map((groupId) => ({
                    user_id: userId,
                    campaign_id: campaign.id,
                    lead_group_id: groupId,
                }));

                const { error: groupsError } = await insertMany('campaign_groups', campaignGroups);
                if (groupsError) {
                    console.error('Error creating campaign groups:', groupsError);
                    toast.error('Error linking groups to campaign');
                }
            }

            // 3. Get all lead IDs from selected groups
            const allLeadIds = new Set(formData.selectedLeads.map((l) => l.id));

            if (formData.selectedLeadGroups.length > 0) {
                for (const groupId of formData.selectedLeadGroups) {
                    const { data: groupLeads } = await supabase
                        .from('lead_groups_map')
                        .select('lead_id')
                        .eq('lead_group_id', groupId);

                    if (groupLeads) {
                        groupLeads.forEach((gl) => allLeadIds.add(gl.lead_id));
                    }
                }
            }

            // 4. Create campaign_leads entries
            if (allLeadIds.size > 0) {
                const campaignLeads = Array.from(allLeadIds).map((leadId) => ({
                    user_id: userId,
                    campaign_id: campaign.id,
                    lead_id: leadId,
                }));

                const { error: leadsError } = await insertMany('campaign_leads', campaignLeads);
                if (leadsError) {
                    console.error('Error creating campaign leads:', leadsError);
                    toast.error('Error linking leads to campaign');
                }
            }

            toast.success('Campaign created successfully!');
            router.push('/campaigns');
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while creating campaign');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-bold text-slate-800">Create Campaign</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
                    <div className="grid grid-cols-2 gap-4">

                        {/* Campaign Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Campaign Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., WhatsApp Campaign - Kuaförler"
                                required
                            />
                        </div>

                        {/* Campaign Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Campaign Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        type: e.target.value,
                                        message: '',
                                        emailTitle: '',
                                        emailContent: '',
                                        note: '',
                                    })
                                }
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select campaign type</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="mail">Email</option>
                                <option value="call">Call</option>
                                <option value="visit">Visit</option>
                            </select>
                        </div>
                    </div>

                    {/* Start/End Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Lead Selection - Split Layout */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Lead Selection <span className="text-red-500">*</span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Left: Lead Groups */}
                            <div className="border border-slate-200 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-slate-700 mb-3">Lead Groups</h3>
                                <div className="max-h-80 overflow-y-auto space-y-2">
                                    {leadGroups.length > 0 ? (
                                        leadGroups.map((group) => (
                                            <label
                                                key={group.id}
                                                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedLeadGroups.includes(group.id)}
                                                    onChange={() => toggleLeadGroup(group.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800">{group.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {group.lead_count || 0} leads
                                                    </p>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            No lead groups found
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Individual Lead Search */}
                            <div className="border border-slate-200 rounded-xl p-4 relative">
                                <h3 className="text-sm font-medium text-slate-700 mb-3">Search Leads</h3>
                                <div className="relative mb-3">
                                    <Search
                                        size={18}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by company, city, district..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Search Results Dropdown - Absolute positioned */}
                                {searchQuery && (
                                    <div className="absolute left-4 right-4 top-[90] mt-1 max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg z-50">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-slate-500">
                                                <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                                                <span className="text-sm">Searching...</span>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="divide-y divide-slate-200">
                                                {searchResults.map((lead) => (
                                                    <div
                                                        key={lead.id}
                                                        className="p-3 hover:bg-slate-50 flex items-center justify-between"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-800 text-sm">
                                                                {lead.company || lead.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {lead.business_type + ' - ' || ''}
                                                                {lead.city || '-'}
                                                                {lead.district ? ` / ${lead.district}` : ''}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => addLead(lead)}
                                                            disabled={formData.selectedLeads.some(
                                                                (l) => l.id === lead.id
                                                            )}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1"
                                                        >
                                                            <Plus size={14} />
                                                            Add
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-slate-500 text-sm">
                                                No leads found
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Leads List */}
                                {formData.selectedLeads.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {formData.selectedLeads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                                            >
                                                <span className="text-sm font-medium text-slate-800">
                                                    {lead.company || lead.name || 'Unknown'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLead(lead.id)}
                                                    className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                                                    title="Remove"
                                                >
                                                    <X size={14} className="text-slate-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>

                    {/* WhatsApp Message */}
                    {formData.type === 'whatsapp' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="6"
                                placeholder="Enter your WhatsApp message. Use {{company_name}}, {{city}}, {{district}} as merge tags."
                                required
                            />
                        </div>
                    )}

                    {/* Email Title & Content */}
                    {formData.type === 'mail' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.emailTitle}
                                    onChange={(e) =>
                                        setFormData({ ...formData, emailTitle: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Email subject"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.emailContent}
                                    onChange={(e) =>
                                        setFormData({ ...formData, emailContent: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="8"
                                    placeholder="Enter your email content. Use {{company_name}}, {{city}}, {{district}} as merge tags."
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Call/Visit Note */}
                    {(formData.type === 'call' || formData.type === 'visit') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Note <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="6"
                                placeholder={`Enter notes for ${formData.type} campaign`}
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/campaigns">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={!isFormValid || isSaving} className="flex items-center gap-2">
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Campaign</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
