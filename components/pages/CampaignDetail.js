'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pause, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import campaignsData from '../../data/campaigns.json';
import leadsData from '../../data/leads.json';
import leadGroupsData from '../../data/leadGroups.json';
import activitiesData from '../../data/activities.json';
import { formatDate } from '../../utils/formatDate';

export default function CampaignDetail({ id }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const campaign = campaignsData.find((c) => c.id === id);
    const campaignLeads = leadsData.filter((lead) =>
        campaign?.leadGroupIds?.some((groupId) => lead.leadGroupIds?.includes(groupId))
    );
    const campaignActivities = activitiesData.filter(
        (a) => a.campaignName === campaign?.name
    );

    if (!campaign) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Campaign not found</p>
            </div>
        );
    }

    const progress = (campaign.sent / campaign.leadCount) * 100;
    const getTypeColor = (type) => {
        switch (type) {
            case 'WhatsApp':
                return 'bg-green-100 text-green-700';
            case 'Email':
                return 'bg-blue-100 text-blue-700';
            case 'Call':
                return 'bg-purple-100 text-purple-700';
            case 'Visit':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

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
                                campaign.type
                            )}`}
                        >
                            {campaign.type}
                        </span>
                        <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${campaign.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                        >
                            {campaign.status}
                        </span>
                        <span className="text-slate-600">{campaign.leadCount} leads</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {campaign.status === 'Active' ? (
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                            <Pause size={18} />
                            <span>Pause</span>
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                            <Play size={18} />
                            <span>Resume</span>
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors">
                        <Trash2 size={18} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {['overview', 'leads', 'activity', 'template'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Progress</span>
                                <span className="text-sm font-medium text-slate-800">
                                    {campaign.sent} / {campaign.leadCount}
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
                                <p className="text-sm text-slate-500 mb-1">Sent</p>
                                <p className="text-2xl font-bold text-slate-800">{campaign.sent}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Remaining</p>
                                <p className="text-2xl font-bold text-slate-800">{campaign.remaining}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-sm text-slate-500 mb-1">Failed</p>
                                <p className="text-2xl font-bold text-red-600">{campaign.failed}</p>
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
                                        Lead Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Last Interaction
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {campaignLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="font-medium text-slate-800 hover:text-blue-600"
                                            >
                                                {lead.companyName}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                                Sent
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDate(lead.lastActivity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        {campaignActivities.length > 0 ? (
                            campaignActivities.map((activity) => (
                                <div key={activity.id} className="p-4 bg-slate-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-slate-800">{activity.title}</p>
                                        <span className="text-xs text-slate-400">
                                            {formatDate(activity.createdDate)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">{activity.description}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-8">No activity yet</p>
                        )}
                    </div>
                )}

                {activeTab === 'template' && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-slate-800 whitespace-pre-wrap">{campaign.messageTemplate}</p>
                        <p className="text-xs text-slate-400 mt-4">
                            Merge tags: {'{'}company_name{'}'}, {'{'}city{'}'}, {'{'}district{'}'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

