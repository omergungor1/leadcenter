'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pause, Play, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatTimeAgo } from '../../utils/formatDate';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchById, fetchAll } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CampaignDetail({ id }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [campaignLeads, setCampaignLeads] = useState([]);
    const [campaignGroups, setCampaignGroups] = useState([]);
    const [groupLeads, setGroupLeads] = useState([]); // Leads from groups (lead_groups_map entries)
    const [campaignActivities, setCampaignActivities] = useState([]);
    const [leadsData, setLeadsData] = useState({}); // Map of lead_id -> lead data
    const [groupLeadCounts, setGroupLeadCounts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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

    // Fetch campaign data
    useEffect(() => {
        const fetchCampaignData = async () => {
            if (!id || !userId) return;

            setIsLoading(true);
            try {
                // Fetch campaign
                const { data: campaignData, error: campaignError } = await fetchById('campaigns', id);

                if (campaignError || !campaignData) {
                    toast.error('Campaign not found');
                    return;
                }

                setCampaign(campaignData);

                // Fetch campaign groups (groups added to campaign)
                const { data: groupsData, error: groupsError } = await fetchAll('campaign_groups', '*', {
                    campaign_id: id,
                });

                if (groupsError) {
                    console.error('Error fetching campaign groups:', groupsError);
                } else {
                    setCampaignGroups(groupsData || []);

                    // Fetch group details to get lead_count
                    if (groupsData && groupsData.length > 0) {
                        const groupIds = groupsData.map((cg) => cg.lead_group_id);
                        const { data: groupDetails } = await fetchAll('lead_groups', '*', {
                            id: groupIds,
                        });

                        // Fetch leads from groups via lead_groups_map (manually added to groups)
                        if (groupDetails && groupIds.length > 0) {
                            const { data: groupMapData } = await fetchAll('lead_groups_map', '*', {
                                lead_group_id: groupIds,
                            });

                            if (groupMapData && groupMapData.length > 0) {
                                // Store group leads mapping
                                setGroupLeads(groupMapData);

                                const groupLeadIds = groupMapData.map((gm) => gm.lead_id);
                                const { data: groupLeadsDetails } = await fetchAll('leads', '*', {
                                    id: groupLeadIds,
                                });

                                if (groupLeadsDetails) {
                                    const leadsMap = {};
                                    groupLeadsDetails.forEach((lead) => {
                                        leadsMap[lead.id] = lead;
                                    });
                                    setLeadsData((prev) => ({ ...prev, ...leadsMap }));
                                }
                            }

                            // Fetch leads with primary_group_id matching campaign groups (automatically added)
                            const { data: primaryGroupLeads, error: primaryGroupLeadsError } = await fetchAll('leads', '*', {
                                primary_group_id: groupIds,
                                is_active: true,
                                is_deleted: false,
                            });

                            if (primaryGroupLeadsError) {
                                console.error('Error fetching primary group leads:', primaryGroupLeadsError);
                            } else if (primaryGroupLeads && primaryGroupLeads.length > 0) {
                                const leadsMap = {};
                                primaryGroupLeads.forEach((lead) => {
                                    leadsMap[lead.id] = lead;
                                });
                                setLeadsData((prev) => ({ ...prev, ...leadsMap }));
                            }
                        }
                    }
                }

                // Fetch campaign leads (from campaign_leads table - individually added leads)
                const { data: leadsData, error: leadsError } = await fetchAll('campaign_leads', '*', {
                    campaign_id: id,
                });

                if (leadsError) {
                    console.error('Error fetching campaign leads:', leadsError);
                } else {
                    setCampaignLeads(leadsData || []);

                    // Fetch lead details
                    if (leadsData && leadsData.length > 0) {
                        const leadIds = leadsData.map((cl) => cl.lead_id);
                        const { data: leadsDetails } = await fetchAll('leads', '*', {
                            id: leadIds,
                        });

                        if (leadsDetails) {
                            const leadsMap = {};
                            leadsDetails.forEach((lead) => {
                                leadsMap[lead.id] = lead;
                            });
                            setLeadsData((prev) => ({ ...prev, ...leadsMap }));
                        }
                    }
                }

                // Fetch campaign activities (only non-deleted)
                const { data: activitiesData, error: activitiesError } = await fetchAll('activities', '*', {
                    campaign_id: id,
                    is_deleted: false,
                });

                if (activitiesError) {
                    console.error('Error fetching activities:', activitiesError);
                } else {
                    const sorted = (activitiesData || []).sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    setCampaignActivities(sorted);
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('An error occurred while loading campaign');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaignData();
    }, [id, userId]);

    // Fetch group lead counts
    useEffect(() => {
        const fetchGroupLeadCounts = async () => {
            if (!campaignGroups || campaignGroups.length === 0) {
                setGroupLeadCounts(0);
                return;
            }

            try {
                const groupIds = campaignGroups.map((cg) => cg.lead_group_id);
                const { data: groupDetails } = await fetchAll('lead_groups', '*', {
                    id: groupIds,
                });

                if (groupDetails) {
                    const totalCount = groupDetails.reduce((sum, group) => sum + (group.lead_count || 0), 0);
                    setGroupLeadCounts(totalCount);
                }
            } catch (error) {
                console.error('Error fetching group lead counts:', error);
            }
        };

        fetchGroupLeadCounts();
    }, [campaignGroups]);

    // Calculate total leads: from groups (lead_count) + individual leads
    const totalLeads = groupLeadCounts + campaignLeads.length;
    const completedLeads = campaignActivities.filter(
        (a) => a.activity_type === campaign?.campaign_type && (a.status === 'completed' || a.status === 'cancelled')
    ).length;
    const remainingLeads = totalLeads - completedLeads;
    const progress = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

    // Check if lead is sent (has completed or cancelled activity)
    const isLeadSent = (leadId) => {
        return campaignActivities.some(
            (a) =>
                a.lead_id === leadId &&
                a.activity_type === campaign?.campaign_type &&
                (a.status === 'completed' || a.status === 'cancelled')
        );
    };

    // Get lead activity status (completed, cancelled, or pending)
    const getLeadActivityStatus = (leadId) => {
        const activity = campaignActivities
            .filter((a) => a.lead_id === leadId && a.activity_type === campaign?.campaign_type)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        if (!activity) return null;
        return activity.status;
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'whatsapp':
                return 'bg-green-100 text-green-700';
            case 'mail':
                return 'bg-blue-100 text-blue-700';
            case 'call':
                return 'bg-purple-100 text-purple-700';
            case 'visit':
                return 'bg-orange-100 text-orange-700';
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
                return 'Arama';
            case 'visit':
                return 'Ziyaret';
            default:
                return type || '-';
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

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'Devam Ediyor';
            case 'completed':
                return 'Tamamlandı';
            case 'cancelled':
                return 'İptal Edildi';
            case 'draft':
                return 'Taslak';
            default:
                return status || '-';
        }
    };

    const handleToggleStatus = async () => {
        if (!campaign || !userId) return;

        const newStatus = campaign.status === 'active' ? 'draft' : 'active';

        try {
            const { error } = await supabase
                .from('campaigns')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', campaign.id);

            if (error) {
                toast.error('Error updating campaign: ' + error.message);
                return;
            }

            toast.success(`Campaign ${newStatus === 'active' ? 'started' : 'paused'} successfully!`);
            setCampaign({ ...campaign, status: newStatus });
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
                    <span>Kampanya yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Kampanya bulunamadı</p>
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
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-800">{campaign.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(
                                campaign.campaign_type
                            )}`}
                        >
                            {getTypeLabel(campaign.campaign_type)}
                        </span>
                        <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
                                campaign.status
                            )}`}
                        >
                            {getStatusLabel(campaign.status)}
                        </span>
                        <span className="text-slate-600">{totalLeads} müşteri</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {campaign.status === 'active' ? (
                        <button
                            onClick={handleToggleStatus}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <Pause size={18} />
                            <span>Duraklat</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleToggleStatus}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <Play size={18} />
                            <span>Başlat</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {['overview', 'leads', 'activity', 'template'].map((tab) => {
                        const tabLabels = {
                            overview: 'Genel Bakış',
                            leads: 'Müşteriler',
                            activity: 'Aktivite',
                            template: 'Şablon'
                        };
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                {tabLabels[tab]}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">İlerleme</span>
                                <span className="text-sm font-medium text-slate-800">
                                    {completedLeads} / {totalLeads}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                                <div
                                    className="bg-blue-500 h-3 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Toplam Müşteri</p>
                                <p className="text-2xl font-bold text-slate-800">{totalLeads}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Gönderilen</p>
                                <p className="text-2xl font-bold text-green-600">{completedLeads}</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Kalan</p>
                                <p className="text-2xl font-bold text-orange-600">{remainingLeads}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Müşteri Adı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Durum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Son İşlem
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {(() => {
                                    // Combine leads from all sources (campaign_leads, lead_groups_map, and primary_group_id)
                                    const allLeadIds = new Set();

                                    // Add individual leads (from campaign_leads table)
                                    campaignLeads.forEach((cl) => {
                                        allLeadIds.add(cl.lead_id);
                                    });

                                    // Add group leads from lead_groups_map (manually added to groups)
                                    groupLeads.forEach((gl) => {
                                        allLeadIds.add(gl.lead_id);
                                    });

                                    // Add leads with primary_group_id matching campaign groups (automatically added)
                                    if (campaignGroups && campaignGroups.length > 0) {
                                        const groupIds = campaignGroups.map((cg) => cg.lead_group_id);
                                        Object.values(leadsData).forEach((lead) => {
                                            if (lead.primary_group_id && groupIds.includes(lead.primary_group_id)) {
                                                allLeadIds.add(lead.id);
                                            }
                                        });
                                    }

                                    const uniqueLeadIds = Array.from(allLeadIds);

                                    if (uniqueLeadIds.length > 0) {
                                        return uniqueLeadIds.map((leadId) => {
                                            const lead = leadsData[leadId];
                                            const activityStatus = getLeadActivityStatus(leadId);
                                            const leadActivity = campaignActivities
                                                .filter((a) => a.lead_id === leadId && a.activity_type === campaign?.campaign_type)
                                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                                            return (
                                                <tr key={leadId} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4">
                                                        {lead ? (
                                                            <Link
                                                                href={`/leads/${lead.id}`}
                                                                className="font-medium text-slate-800 hover:text-blue-600"
                                                            >
                                                                {lead.company || lead.name || 'Unknown'}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-slate-400">Yükleniyor...</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {activityStatus === 'completed' ? (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                                                Gönderilen
                                                            </span>
                                                        ) : activityStatus === 'cancelled' ? (
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                                                                İptal
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                                                                Beklemede
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {leadActivity
                                                            ? formatTimeAgo(leadActivity.created_at)
                                                            : '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {lead && (
                                                            <Link
                                                                href={`/leads/${lead.id}`}
                                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                            >
                                                                <Eye size={16} />
                                                                Görüntüle
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    } else {
                                        return (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                                    Müşteri bulunamadı
                                                </td>
                                            </tr>
                                        );
                                    }
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        {campaignActivities.length > 0 ? (
                            campaignActivities.map((activity) => {
                                const lead = leadsData[activity.lead_id];
                                return (
                                    <div key={activity.id} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800">
                                                    {activity.activity_type?.charAt(0).toUpperCase() +
                                                        activity.activity_type?.slice(1) || 'Activity'}
                                                </p>
                                                {lead && (
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        Lead: {lead.company || lead.name || 'Unknown'}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {formatTimeAgo(activity.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{activity.content || '-'}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${activity.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : activity.status === 'cancelled'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {activity.status === 'completed'
                                                    ? 'Tamamlandı'
                                                    : activity.status === 'cancelled'
                                                        ? 'İptal'
                                                        : 'Beklemede'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-slate-500 text-center py-8">Henüz işlem yok</p>
                        )}
                    </div>
                )}

                {activeTab === 'template' && (
                    <div className="space-y-4">
                        {campaign.title && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Başlık
                                </label>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-slate-800">{campaign.title}</p>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                İçerik
                            </label>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-slate-800 whitespace-pre-wrap">
                                    {campaign.content || '-'}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">
                            Birleştirme etiketleri: {'{'}company_name{'}'}, {'{'}city{'}'}, {'{'}district{'}'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
