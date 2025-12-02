'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Filter, Plus, Play, Pause, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll, updateById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CampaignsList() {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
    });

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

    // Fetch campaigns with progress calculation
    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                // Fetch campaigns
                const { data: campaignsData, error: campaignsError } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (campaignsError) {
                    toast.error('Error loading campaigns: ' + campaignsError.message);
                    return;
                }

                if (!campaignsData) {
                    setCampaigns([]);
                    return;
                }

                // Calculate progress for each campaign
                const campaignsWithProgress = await Promise.all(
                    campaignsData.map(async (campaign) => {
                        // Get total leads from campaign.total_leads (already calculated)
                        const total = campaign.total_leads || 0;

                        // Get completed leads count (activities with same type as campaign)
                        const { count: completedLeads } = await supabase
                            .from('activities')
                            .select('*', { count: 'exact', head: true })
                            .eq('campaign_id', campaign.id)
                            .eq('activity_type', campaign.campaign_type)
                            .eq('status', 'completed');

                        const completed = completedLeads || 0;
                        const remaining = total - completed;
                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                        return {
                            ...campaign,
                            totalLeads: total,
                            completedLeads: completed,
                            remainingLeads: remaining,
                            progress,
                        };
                    })
                );

                setCampaigns(campaignsWithProgress);
            } catch (error) {
                console.error('Error:', error);
                toast.error('An error occurred while loading campaigns');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaigns();
    }, [userId]);

    const filteredCampaigns = campaigns.filter((campaign) => {
        if (filters.type && campaign.campaign_type !== filters.type.toLowerCase()) return false;
        if (filters.status && campaign.status !== filters.status.toLowerCase()) return false;
        return true;
    });

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'whatsapp':
                return 'bg-green-100 text-green-700';
            case 'mail':
            case 'email':
                return 'bg-blue-100 text-blue-700';
            case 'call':
                return 'bg-purple-100 text-purple-700';
            case 'visit':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'completed':
                return 'bg-blue-100 text-blue-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            case 'draft':
                return 'bg-slate-100 text-slate-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const getTypeLabel = (type) => {
        switch (type?.toLowerCase()) {
            case 'whatsapp':
                return 'WhatsApp';
            case 'mail':
                return 'Email';
            case 'call':
                return 'Call';
            case 'visit':
                return 'Visit';
            default:
                return type || '-';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'Active';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            case 'draft':
                return 'Draft';
            default:
                return status || '-';
        }
    };

    const handleToggleStatus = async (campaign) => {
        if (!userId) return;

        const newStatus = campaign.status === 'active' ? 'draft' : 'active';

        try {
            const { error } = await updateById('campaigns', campaign.id, {
                status: newStatus,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                toast.error('Error updating campaign: ' + error.message);
                return;
            }

            toast.success(`Campaign ${newStatus === 'active' ? 'started' : 'paused'} successfully!`);

            // Update local state
            setCampaigns((prev) =>
                prev.map((c) =>
                    c.id === campaign.id
                        ? { ...c, status: newStatus, updated_at: new Date().toISOString() }
                        : c
                )
            );
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading campaigns...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Campaigns</h1>
                <Link href="/campaigns/new">
                    <button
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        <span>Campaign</span>
                    </button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-slate-500" />
                    <span className="font-medium text-slate-700">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="mail">Email</option>
                        <option value="call">Call</option>
                        <option value="visit">Visit</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                        onClick={() => setFilters({ type: '', status: '' })}
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Campaign Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Total Leads
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Sent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Remaining
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Progress
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Created Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredCampaigns.length > 0 ? (
                                filteredCampaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/campaigns/${campaign.id}`}
                                                className="font-medium text-slate-800 hover:text-blue-600"
                                            >
                                                {campaign.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(
                                                    campaign.campaign_type
                                                )}`}
                                            >
                                                {getTypeLabel(campaign.campaign_type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                                                    campaign.status
                                                )}`}
                                            >
                                                {getStatusLabel(campaign.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {campaign.totalLeads || 0}
                                        </td>
                                        <td className="px-6 py-4 text-green-600 font-medium">
                                            {campaign.completedLeads || 0}
                                        </td>
                                        <td className="px-6 py-4 text-orange-600 font-medium">
                                            {campaign.remainingLeads || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 rounded-full h-2 min-w-[60px]">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${campaign.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 min-w-[35px]">
                                                    {campaign.progress}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDate(campaign.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {campaign.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(campaign)}
                                                        className="text-orange-600 hover:text-orange-800 flex items-center gap-1"
                                                        title="Pause Campaign"
                                                    >
                                                        <Pause size={16} />
                                                    </button>
                                                ) : campaign.status === 'draft' ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(campaign)}
                                                        className="text-green-600 hover:text-green-800 flex items-center gap-1"
                                                        title="Start Campaign"
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                ) : null}
                                                <Link
                                                    href={`/campaigns/${campaign.id}`}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                                        No campaigns found
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
