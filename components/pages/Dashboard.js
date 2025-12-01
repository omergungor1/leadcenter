'use client';

import { useEffect, useState } from 'react';
import { Users, User, Megaphone, CheckSquare, ArrowRight, MessageSquare, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import leadsData from '../../data/leads.json';
import leadGroupsData from '../../data/leadGroups.json';
import campaignsData from '../../data/campaigns.json';
import tasksData from '../../data/tasks.json';
import activitiesData from '../../data/activities.json';
import { formatDate } from '../../utils/formatDate';

export default function Dashboard() {
    // Daily limits from Settings (mock - in real app, this would come from API/context)
    const dailyLimits = {
        whatsapp: 100,
        call: 50,
        email: 200,
        visit: 20,
    };

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

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const tasksToday = tasksData.filter(
            (task) => task.dueDate.split('T')[0] === today && task.status === 'Pending'
        );

        // Count today's activities by type
        const todayActivities = activitiesData.filter((activity) => {
            const activityDate = new Date(activity.createdDate).toISOString().split('T')[0];
            return activityDate === today;
        });

        // Count activities by type (mock: using activities data, in real app would count actual campaign sends)
        const whatsappCount = todayActivities.filter((a) => a.type === 'WhatsApp').length;
        const callCount = todayActivities.filter((a) => a.type === 'Call').length;
        const emailCount = todayActivities.filter((a) => a.type === 'Email').length;
        const visitCount = 0; // No visit activities in mock data

        // Mock: Add some additional counts from active campaigns (simulating today's sends)
        const activeCampaigns = campaignsData.filter((c) => c.status === 'Active');
        let mockWhatsapp = whatsappCount + (activeCampaigns.find((c) => c.type === 'WhatsApp')?.sent || 0);
        let mockCall = callCount + (activeCampaigns.find((c) => c.type === 'Call')?.sent || 0);
        let mockEmail = emailCount + (activeCampaigns.find((c) => c.type === 'Email')?.sent || 0);
        let mockVisit = visitCount + (activeCampaigns.find((c) => c.type === 'Visit')?.sent || 0);

        // Cap at daily limit
        mockWhatsapp = Math.min(mockWhatsapp, dailyLimits.whatsapp);
        mockCall = Math.min(mockCall, dailyLimits.call);
        mockEmail = Math.min(mockEmail, dailyLimits.email);
        mockVisit = Math.min(mockVisit, dailyLimits.visit);

        setStats({
            totalLeads: leadsData.length,
            totalLeadGroups: leadGroupsData.length,
            activeCampaigns: activeCampaigns.length,
            tasksDueToday: tasksToday.length,
        });

        setDailyGoals({
            whatsapp: {
                completed: mockWhatsapp,
                remaining: Math.max(0, dailyLimits.whatsapp - mockWhatsapp),
                percentage: dailyLimits.whatsapp > 0 ? Math.round((mockWhatsapp / dailyLimits.whatsapp) * 100) : 0,
            },
            call: {
                completed: mockCall,
                remaining: Math.max(0, dailyLimits.call - mockCall),
                percentage: dailyLimits.call > 0 ? Math.round((mockCall / dailyLimits.call) * 100) : 0,
            },
            email: {
                completed: mockEmail,
                remaining: Math.max(0, dailyLimits.email - mockEmail),
                percentage: dailyLimits.email > 0 ? Math.round((mockEmail / dailyLimits.email) * 100) : 0,
            },
            visit: {
                completed: mockVisit,
                remaining: Math.max(0, dailyLimits.visit - mockVisit),
                percentage: dailyLimits.visit > 0 ? Math.round((mockVisit / dailyLimits.visit) * 100) : 0,
            },
        });
    }, []);

    const todayTasks = tasksData.filter((task) => {
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate.split('T')[0] === today;
    });

    const latestLeadGroups = leadGroupsData
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 5);

    const ongoingCampaigns = campaignsData.filter((c) => c.status === 'Active');

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={User}
                    label="Total Leads"
                    value={stats.totalLeads}
                    color="blue"
                />
                <StatCard
                    icon={Users}
                    label="Total Lead Groups"
                    value={stats.totalLeadGroups}
                    color="green"
                />
                <StatCard
                    icon={Megaphone}
                    label="Active Campaigns"
                    value={stats.activeCampaigns}
                    color="purple"
                />
                <StatCard
                    icon={CheckSquare}
                    label="Tasks Due Today"
                    value={stats.tasksDueToday}
                    color="orange"
                />
            </div>

            {/* Daily Campaign Goals */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Daily Campaign Goals</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Today's progress towards daily campaign targets
                        </p>
                    </div>
                    <Link
                        href="/settings"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        Manage Limits
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
                        label="Call"
                        goal={dailyLimits.call}
                        completed={dailyGoals.call.completed}
                        remaining={dailyGoals.call.remaining}
                        percentage={dailyGoals.call.percentage}
                        color="blue"
                    />
                    <DailyGoalCard
                        icon={Mail}
                        label="Email"
                        goal={dailyLimits.email}
                        completed={dailyGoals.email.completed}
                        remaining={dailyGoals.email.remaining}
                        percentage={dailyGoals.email.percentage}
                        color="purple"
                    />
                    <DailyGoalCard
                        icon={MapPin}
                        label="Visit"
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
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-slate-800">Today's Tasks</h2>
                        <Link
                            href="/tasks"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            View all
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                        {todayTasks.length > 0 ? (
                            todayTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{task.taskName}</p>
                                        <p className="text-sm text-slate-500">{task.relatedLeadName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${task.status === 'Completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4">No tasks due today</p>
                        )}
                    </div>
                </div>

                {/* Latest Lead Groups */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-slate-800">Latest Lead Groups</h2>
                        <Link
                            href="/lead-groups"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            View all
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                                    <th className="pb-3">Group Name</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Leads</th>
                                    <th className="pb-3">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestLeadGroups.map((group) => (
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
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${group.status === 'Completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : group.status === 'Processing'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {group.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-slate-600">{group.leadCount}</td>
                                        <td className="py-3 text-sm text-slate-500">
                                            {formatDate(group.lastUpdated)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Ongoing Campaigns */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">Ongoing Campaigns</h2>
                    <Link
                        href="/campaigns"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        View all
                        <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="space-y-4">
                    {ongoingCampaigns.length > 0 ? (
                        ongoingCampaigns.map((campaign) => {
                            const progress = (campaign.sent / campaign.leadCount) * 100;
                            return (
                                <div key={campaign.id} className="p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium text-slate-800">{campaign.name}</h3>
                                            <span
                                                className={`px-2 py-1 rounded-lg text-xs font-medium ${campaign.type === 'WhatsApp'
                                                    ? 'bg-green-100 text-green-700'
                                                    : campaign.type === 'Email'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : campaign.type === 'Call'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {campaign.type}
                                            </span>
                                        </div>
                                        <span className="text-sm text-slate-600">
                                            {campaign.sent} / {campaign.leadCount}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 text-center py-4">No active campaigns</p>
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
                    <p className="text-xs text-slate-500">Daily Goal: {goal}</p>
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
                <span className="text-slate-500">Remaining:</span>
                <span className="font-medium text-slate-700">{remaining}</span>
            </div>
        </div>
    );
}

