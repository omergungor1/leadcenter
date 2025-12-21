'use client';

import { useEffect, useState } from 'react';
import { Users, User, Megaphone, CheckSquare, ArrowRight, MessageSquare, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [todayTasks, setTodayTasks] = useState([]);
    const [leadsMap, setLeadsMap] = useState({}); // Map of lead_id -> lead data
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);
    const [latestLeadGroups, setLatestLeadGroups] = useState([]);
    const [ongoingCampaigns, setOngoingCampaigns] = useState([]);

    const [dailyLimits, setDailyLimits] = useState({
        whatsapp: 100,
        call: 50,
        email: 200,
        visit: 20,
    });

    const [stats, setStats] = useState({
        totalLeads: 0,
        totalLeadGroups: 0,
        activeCampaigns: 0,
        tasksDueToday: 0,
    });

    const [dailyGoals, setDailyGoals] = useState({
        whatsapp: { completed: 0, remaining: 0, percentage: 0 },
        call: { completed: 0, remaining: 0, percentage: 0 },
        email: { completed: 0, remaining: 0, percentage: 0 },
        visit: { completed: 0, remaining: 0, percentage: 0 },
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

    // Fetch today's tasks
    useEffect(() => {
        const fetchTodayTasks = async () => {
            if (!userId) return;

            setIsLoadingTasks(true);
            try {
                // Get today's date (start of day)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStart = today.toISOString();
                const todayEnd = new Date(today);
                todayEnd.setHours(23, 59, 59, 999);
                const todayEndStr = todayEnd.toISOString();

                // Fetch all activities with due_date for today
                const { data: activitiesData, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_deleted', false)
                    .eq('status', 'pending')
                    .not('due_date', 'is', null)
                    // .gte('due_date', todayStart)
                    .lte('due_date', todayEndStr)
                    .order('due_date', { ascending: true });

                if (error) {
                    console.error('Error loading tasks:', error);
                    return;
                }

                if (activitiesData && activitiesData.length > 0) {
                    // Fetch lead data for each task
                    const leadIds = [...new Set(activitiesData.map((a) => a.lead_id).filter(Boolean))];
                    const leadsMap = {};

                    if (leadIds.length > 0) {
                        const { data: leadsData } = await supabase
                            .from('leads')
                            .select('id, company, name')
                            .in('id', leadIds);

                        if (leadsData) {
                            leadsData.forEach((lead) => {
                                leadsMap[lead.id] = lead;
                            });
                        }
                    }

                    setLeadsMap(leadsMap);
                    setTodayTasks(activitiesData);
                    setStats((prev) => ({
                        ...prev,
                        tasksDueToday: activitiesData.length,
                    }));
                } else {
                    setTodayTasks([]);
                    setStats((prev) => ({
                        ...prev,
                        tasksDueToday: 0,
                    }));
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoadingTasks(false);
            }
        };

        fetchTodayTasks();
    }, [userId]);

    // Fetch stats (leads, groups, campaigns)
    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) return;

            try {
                // Fetch total leads
                const { data: leadsData } = await fetchAll('leads', 'id', {
                    user_id: userId,
                });

                // Fetch total lead groups
                const { data: groupsData } = await fetchAll('lead_groups', 'id', {
                    user_id: userId,
                });

                // Fetch active campaigns
                const { data: campaignsData } = await fetchAll('campaigns', 'id', {
                    user_id: userId,
                    status: 'active',
                });

                setStats((prev) => ({
                    ...prev,
                    totalLeads: leadsData?.length || 0,
                    totalLeadGroups: groupsData?.length || 0,
                    activeCampaigns: campaignsData?.length || 0,
                }));
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, [userId]);

    // Fetch latest lead groups
    useEffect(() => {
        const fetchLatestGroups = async () => {
            if (!userId) return;

            try {
                const { data: groupsData } = await fetchAll('lead_groups', '*', {
                    user_id: userId,
                });

                if (groupsData) {
                    // Sort by updated_at or created_at and take latest 5
                    const sorted = groupsData
                        .sort((a, b) => {
                            const dateA = new Date(a.updated_at || a.created_at || 0);
                            const dateB = new Date(b.updated_at || b.created_at || 0);
                            return dateB - dateA;
                        })
                        .slice(0, 5);

                    // Fetch lead counts for each group
                    const groupsWithCounts = await Promise.all(
                        sorted.map(async (group) => {
                            // Count leads in this group (from lead_groups_map)
                            const { data: mapData } = await fetchAll('lead_groups', 'lead_count', {
                                id: group.id,
                            });
                            return {
                                ...group,
                                leadCount: mapData[0].lead_count || 0,
                            };
                        })
                    );

                    setLatestLeadGroups(groupsWithCounts);
                }
            } catch (error) {
                console.error('Error fetching latest groups:', error);
            }
        };

        fetchLatestGroups();
    }, [userId]);

    // Fetch ongoing campaigns
    useEffect(() => {
        const fetchOngoingCampaigns = async () => {
            if (!userId) return;

            try {
                const { data: campaignsData } = await fetchAll('campaigns', '*', {
                    user_id: userId,
                    status: 'active',
                });

                if (campaignsData) {
                    // Fetch lead counts for each campaign
                    const campaignsWithCounts = await Promise.all(
                        campaignsData.map(async (campaign) => {
                            // Count leads in this campaign (from campaign_leads - tek tek eklenen leadler)
                            const { data: leadsData } = await fetchAll('campaign_leads', 'id', {
                                campaign_id: campaign.id,
                            });
                            const individualLeadCount = leadsData?.length || 0;

                            // Count leads from groups (campaign_groups -> lead_groups -> lead_count)
                            const { data: campaignGroupsData } = await fetchAll('campaign_groups', 'lead_group_id', {
                                campaign_id: campaign.id,
                            });

                            let groupLeadCount = 0;
                            if (campaignGroupsData && campaignGroupsData.length > 0) {
                                const leadGroupIds = campaignGroupsData.map((cg) => cg.lead_group_id);
                                const { data: leadGroupsData } = await fetchAll('lead_groups', 'lead_count', {
                                    id: leadGroupIds,
                                });

                                if (leadGroupsData && leadGroupsData.length > 0) {
                                    groupLeadCount = leadGroupsData.reduce((sum, group) => {
                                        return sum + (group.lead_count || 0);
                                    }, 0);
                                }
                            }

                            // Toplam lead sayısı = tek tek eklenen + grup olarak eklenen
                            const totalLeadCount = individualLeadCount + groupLeadCount;

                            // Get completed activities count (activities with same type as campaign)
                            const { count: completedCount } = await supabase
                                .from('activities')
                                .select('*', { count: 'exact', head: true })
                                .eq('campaign_id', campaign.id)
                                .eq('activity_type', campaign.campaign_type)
                                .eq('status', 'completed');

                            const sent = completedCount || 0;

                            return {
                                ...campaign,
                                leadCount: totalLeadCount,
                                sent: sent,
                            };
                        })
                    );

                    setOngoingCampaigns(campaignsWithCounts);
                }
            } catch (error) {
                console.error('Error fetching ongoing campaigns:', error);
            }
        };

        fetchOngoingCampaigns();
    }, [userId]);

    // Fetch daily limits from user settings
    useEffect(() => {
        const fetchDailyLimits = async () => {
            if (!userId) return;

            try {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('whatsapp_limit, call_limit, mail_limit, visit_limit')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error('Error fetching daily limits:', error);
                    return;
                }

                if (userData) {
                    setDailyLimits({
                        whatsapp: userData.whatsapp_limit || 100,
                        call: userData.call_limit || 50,
                        email: userData.mail_limit || 200,
                        visit: userData.visit_limit || 20,
                    });
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchDailyLimits();
    }, [userId]);

    // Fetch today's completed activities count
    useEffect(() => {
        const fetchTodayCompletedActivities = async () => {
            if (!userId) return;

            try {
                // Get today's date (start and end of day)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStart = today.toISOString();
                const todayEnd = new Date(today);
                todayEnd.setHours(23, 59, 59, 999);
                const todayEndStr = todayEnd.toISOString();

                // Fetch all completed activities created today
                const { data: activitiesData, error } = await supabase
                    .from('activities')
                    .select('activity_type')
                    .eq('user_id', userId)
                    .eq('status', 'completed')
                    .eq('is_deleted', false)
                    .gte('created_at', todayStart)
                    .lte('created_at', todayEndStr);

                if (error) {
                    console.error('Error fetching today activities:', error);
                    return;
                }

                // Count activities by type
                const whatsappCount = activitiesData?.filter((a) => a.activity_type === 'whatsapp').length || 0;
                const callCount = activitiesData?.filter((a) => a.activity_type === 'call').length || 0;
                const emailCount = activitiesData?.filter((a) => a.activity_type === 'email').length || 0;
                const visitCount = activitiesData?.filter((a) => a.activity_type === 'visit').length || 0;

                // Calculate goals
                setDailyGoals({
                    whatsapp: {
                        completed: whatsappCount,
                        remaining: Math.max(0, dailyLimits.whatsapp - whatsappCount),
                        percentage: dailyLimits.whatsapp > 0 ? Math.round((whatsappCount / dailyLimits.whatsapp) * 100) : 0,
                    },
                    call: {
                        completed: callCount,
                        remaining: Math.max(0, dailyLimits.call - callCount),
                        percentage: dailyLimits.call > 0 ? Math.round((callCount / dailyLimits.call) * 100) : 0,
                    },
                    email: {
                        completed: emailCount,
                        remaining: Math.max(0, dailyLimits.email - emailCount),
                        percentage: dailyLimits.email > 0 ? Math.round((emailCount / dailyLimits.email) * 100) : 0,
                    },
                    visit: {
                        completed: visitCount,
                        remaining: Math.max(0, dailyLimits.visit - visitCount),
                        percentage: dailyLimits.visit > 0 ? Math.round((visitCount / dailyLimits.visit) * 100) : 0,
                    },
                });
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchTodayCompletedActivities();
    }, [userId, dailyLimits]);

    const getActivityTypeLabel = (type) => {
        if (!type) return '-';
        const labels = {
            note: 'Note',
            email: 'Email',
            call: 'Call',
            whatsapp: 'WhatsApp',
            follow_up: 'Follow Up',
            visit: 'Visit',
            meeting: 'Meeting',
            todo: 'Todo',
        };
        return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getStatusLabel = (status) => {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Panel</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={User}
                    label="Toplam Müşteri"
                    value={stats.totalLeads}
                    color="blue"
                />
                <StatCard
                    icon={Users}
                    label="Toplam Müşteri Grubu"
                    value={stats.totalLeadGroups}
                    color="green"
                />
                <StatCard
                    icon={Megaphone}
                    label="Aktif Kampanya"
                    value={stats.activeCampaigns}
                    color="purple"
                />
                <StatCard
                    icon={CheckSquare}
                    label="Bugünün Görevleri"
                    value={stats.tasksDueToday}
                    color="orange"
                />
            </div>

            {/* Daily Campaign Goals */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Günlük Kampanya Hedefleri</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Bugünün kampanya hedeflerine ilerleme
                        </p>
                    </div>
                    <Link
                        href="/settings"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        Limitleri Yönet
                        <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DailyGoalCard
                        icon={MessageSquare}
                        label="WhatsApp"
                        goal={dailyLimits.whatsapp}
                        completed={dailyGoals.whatsapp.completed}
                        remaining={dailyGoals.whatsapp.remaining}
                        percentage={dailyGoals.whatsapp.percentage}
                        color="green"
                    />
                    <DailyGoalCard
                        icon={Phone}
                        label="Arama"
                        goal={dailyLimits.call}
                        completed={dailyGoals.call.completed}
                        remaining={dailyGoals.call.remaining}
                        percentage={dailyGoals.call.percentage}
                        color="blue"
                    />
                    <DailyGoalCard
                        icon={Mail}
                        label="E-posta"
                        goal={dailyLimits.email}
                        completed={dailyGoals.email.completed}
                        remaining={dailyGoals.email.remaining}
                        percentage={dailyGoals.email.percentage}
                        color="purple"
                    />
                    <DailyGoalCard
                        icon={MapPin}
                        label="Ziyaret"
                        goal={dailyLimits.visit}
                        completed={dailyGoals.visit.completed}
                        remaining={dailyGoals.visit.remaining}
                        percentage={dailyGoals.visit.percentage}
                        color="orange"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Today's Tasks */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col h-100">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-slate-800">Bugünün Görevleri</h2>
                        <Link
                            href="/tasks"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            Tümünü Gör
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                        {isLoadingTasks ? (
                            <p className="text-slate-500 text-center py-4">Görevler yükleniyor...</p>
                        ) : todayTasks.length > 0 ? (
                            todayTasks.map((task) => {
                                const lead = leadsMap[task.lead_id];
                                const leadName = lead ? (lead.company || lead.name || 'Bilinmeyen Müşteri') : 'Müşteri Yok';
                                return (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/leads/${task.lead_id}`}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                            >
                                                <p className="font-medium text-slate-800 truncate">
                                                    {task.content || getActivityTypeLabel(task.activity_type)}
                                                </p>
                                            </Link>
                                            <p className="text-sm text-slate-500 truncate">{leadName} {task.due_date.split('T')[0].split('-').reverse().join('/')}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(task.status)}`}
                                            >
                                                {task.status == 'pending' ? 'Beklemede' : task.status == 'completed' ? 'Tamamlandı' : 'İptal Edildi'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-slate-500 text-center py-4">Bugünün görevleri yok</p>
                        )}
                    </div>
                </div>

                {/* Latest Lead Groups */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col h-100">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-slate-800">Son Müşteri Grupları</h2>
                        <Link
                            href="/lead-groups"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            Tümünü Gör
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                                    <th className="pb-3">Grup Adı</th>
                                    <th className="pb-3">Durum</th>
                                    <th className="pb-3">Müşteriler</th>
                                    <th className="pb-3">Güncellendi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestLeadGroups.length > 0 ? (
                                    latestLeadGroups.map((group) => (
                                        <tr key={group.id} className="border-b border-slate-100">
                                            <td className="py-3">
                                                <Link
                                                    href={`/lead-groups/${group.id}`}
                                                    className="font-medium text-slate-800 hover:text-blue-600"
                                                >
                                                    {group.name}
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                                                    Aktif
                                                </span>
                                            </td>
                                            <td className="py-3 text-slate-600">{group.leadCount || 0}</td>
                                            <td className="py-3 text-sm text-slate-500">
                                                {formatDate(group.updated_at || group.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 text-center text-slate-500">
                                            Müşteri grupları yok
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Ongoing Campaigns */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">Aktif Kampanyalar</h2>
                    <Link
                        href="/campaigns"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        Tümünü Gör
                        <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="space-y-4">
                    {ongoingCampaigns.length > 0 ? (
                        ongoingCampaigns.map((campaign) => {
                            const progress = campaign.leadCount > 0 ? (campaign.sent / campaign.leadCount) * 100 : 0;
                            const campaignTypeLabel = campaign.campaign_type
                                ? campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1)
                                : 'Unknown';
                            return (
                                <div key={campaign.id} className="p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium text-slate-800">{campaign.name}</h3>
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${campaign.campaign_type === 'whatsapp'
                                                    ? 'bg-green-100 text-green-700'
                                                    : campaign.campaign_type === 'mail'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : campaign.campaign_type === 'call'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {campaignTypeLabel}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 whitespace-nowrap">
                                            <span className="text-green-600 font-medium">{campaign.sent || 0}</span>
                                            <span className="text-slate-400 mx-1">/</span>
                                            <span className="font-medium">{campaign.leadCount || 0}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 text-center py-4">Aktif kampanya yok</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-800">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
}

function DailyGoalCard({ icon: Icon, label, goal, completed, remaining, percentage, color }) {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-500' },
        green: { bg: 'bg-green-50', text: 'text-green-600', progress: 'bg-green-500' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', progress: 'bg-purple-500' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', progress: 'bg-orange-500' },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{label}</h3>
                    <p className="text-xs text-slate-500">Günlük Hedef: {goal}</p>
                </div>
            </div>
            <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                        {completed} / {goal}
                    </span>
                    <span className={`text-sm font-bold ${colors.text}`}>{percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className={`${colors.progress} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>
            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Kalan:</span>
                <span className="font-medium text-slate-700">{remaining}</span>
            </div>
        </div>
    );
}

