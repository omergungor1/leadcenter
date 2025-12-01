'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Globe,
    Map,
    Edit,
    FileText,
    PhoneCall,
    Mail as MailIcon,
    MessageSquare,
    CheckSquare,
    Calendar,
    Plus,
    Clock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone } from 'lucide-react';
import leadsData from '../../data/leads.json';
import leadGroupsData from '../../data/leadGroups.json';
import campaignsData from '../../data/campaigns.json';
import activitiesData from '../../data/activities.json';
import tasksData from '../../data/tasks.json';
import { formatDate, formatDateTime, formatTime } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

export default function LeadDetail({ id }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('activity');
    const lead = leadsData.find((l) => l.id === id);
    const leadActivities = activitiesData
        .filter((a) => a.leadId === id)
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)); // Sort by date, newest first
    const leadTasks = tasksData.filter((t) => t.relatedLeadId === id);
    const leadGroups = leadGroupsData.filter((g) => lead?.leadGroupIds?.includes(g.id));

    // Find campaigns that include this lead
    const leadCampaigns = campaignsData.filter((campaign) => {
        // Check if campaign includes any of the lead's groups
        return campaign.leadGroupIds?.some((groupId) => lead?.leadGroupIds?.includes(groupId));
    });

    if (!lead) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Lead not found</p>
            </div>
        );
    }

    const getActivityIcon = (type) => {
        switch (type) {
            case 'Note':
                return FileText;
            case 'Call':
                return PhoneCall;
            case 'Email':
                return MailIcon;
            case 'WhatsApp':
                return MessageSquare;
            case 'Task':
                return CheckSquare;
            case 'Meeting':
                return Calendar;
            case 'Visit':
                return MapPin;
            default:
                return FileText;
        }
    };

    // Filter visits from activities
    const leadVisits = leadActivities.filter((a) => a.type === 'Visit');

    return (
        <div className="p-6 space-y-6">
            <button
                onClick={() => router.back()}
                className="flex cursor-pointer items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Info Panel */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-6 gap-4">
                            <button className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText size={20} className="text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Note</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <MailIcon size={20} className="text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Email</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <PhoneCall size={20} className="text-purple-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Call</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <MapPin size={20} className="text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Visit</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <CheckSquare size={20} className="text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Task</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Calendar size={20} className="text-indigo-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Meeting</span>
                            </button>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">{lead.companyName}</h2>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <Edit size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-slate-400 mt-1" />
                                <div>
                                    <p className="text-sm text-slate-500">Address</p>
                                    <p className="text-slate-800">{lead.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-slate-400 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm text-slate-500">Phone</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-slate-800">{formatPhoneNumber(lead.phone)}</p>
                                        {lead.hasWhatsApp && (
                                            <a
                                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative group"
                                                title="Bu kullanıcının wp si var. Whatsapp tan mesaj at"
                                            >
                                                <Image
                                                    src="/wp-icon.png"
                                                    alt="WhatsApp available"
                                                    width={20}
                                                    height={20}
                                                    className="rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                />
                                                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                    Bu kullanıcının wp si var. Whatsapp tan mesaj at
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-slate-400 mt-1" />
                                <div>
                                    <p className="text-sm text-slate-500">Email</p>
                                    <p className="text-slate-800">{lead.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Globe size={18} className="text-slate-400 mt-1" />
                                <div>
                                    <p className="text-sm text-slate-500">Website</p>
                                    <a
                                        href={`https://${lead.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        {lead.website}
                                    </a>
                                </div>
                            </div>

                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
                                <Map size={18} />
                                <span>Google Maps</span>
                            </button>

                            {lead.workingHours && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={18} className="text-slate-400" />
                                        <p className="text-sm font-medium text-slate-700">Working Hours</p>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(lead.workingHours).map(([day, hours]) => (
                                            <div key={day} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                                                <span className="text-sm text-slate-600">{day}</span>
                                                <span className="text-sm font-medium text-slate-800">{hours}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Middle Column - Activity Timeline */}
                <div className="col-span-12 lg:col-span-6 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        {/* Tabs */}
                        <div className="border-b border-slate-200">
                            <nav className="flex space-x-8 px-6 overflow-x-auto">
                                {['activity', 'notes', 'emails', 'calls', 'whatsapp', 'tasks', 'meetings', 'visits'].map(
                                    (tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    )
                                )}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'activity' && (
                                <div className="relative">
                                    {leadActivities.length > 0 ? (
                                        <div className="relative">
                                            {/* Timeline Vertical Line */}
                                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                                            <div className="space-y-6">
                                                {leadActivities.map((activity, index) => {
                                                    const Icon = getActivityIcon(activity.type);

                                                    // Get icon color based on type
                                                    const getIconColor = (type) => {
                                                        switch (type) {
                                                            case 'Note':
                                                                return 'bg-blue-500 text-white border-blue-600';
                                                            case 'Call':
                                                                return 'bg-purple-500 text-white border-purple-600';
                                                            case 'Email':
                                                                return 'bg-blue-500 text-white border-blue-600';
                                                            case 'WhatsApp':
                                                                return 'bg-green-500 text-white border-green-600';
                                                            case 'Task':
                                                                return 'bg-orange-500 text-white border-orange-600';
                                                            case 'Meeting':
                                                                return 'bg-indigo-500 text-white border-indigo-600';
                                                            case 'Visit':
                                                                return 'bg-orange-500 text-white border-orange-600';
                                                            default:
                                                                return 'bg-slate-500 text-white border-slate-600';
                                                        }
                                                    };

                                                    return (
                                                        <div key={activity.id} className="relative flex gap-4 pl-2">
                                                            {/* Timeline Dot with Icon */}
                                                            <div className="flex-shrink-0 relative z-10">
                                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getIconColor(activity.type)} shadow-sm`}>
                                                                    <Icon size={20} />
                                                                </div>
                                                            </div>

                                                            {/* Message Bubble */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <p className="font-semibold text-slate-800">{activity.title}</p>
                                                                    </div>
                                                                    <p className="text-sm text-slate-700 mb-3">{activity.description}</p>

                                                                    {/* Additional Info */}
                                                                    <div className="space-y-1 mb-3">
                                                                        {activity.duration && (
                                                                            <p className="text-xs text-slate-500">
                                                                                <span className="font-medium">Duration:</span> {activity.duration}
                                                                            </p>
                                                                        )}
                                                                        {activity.subject && (
                                                                            <p className="text-xs text-slate-500">
                                                                                <span className="font-medium">Subject:</span> {activity.subject}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-slate-500">
                                                                            <span className="font-medium">By:</span> {activity.createdBy}
                                                                        </p>
                                                                    </div>

                                                                    {/* Date/Time at bottom right */}
                                                                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-200">
                                                                        <span className="text-xs text-slate-400">
                                                                            {formatDateTime(activity.createdDate)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">No activities yet</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    {leadActivities
                                        .filter((a) => a.type === 'Note')
                                        .map((activity) => (
                                            <div key={activity.id} className="p-4 bg-slate-50 rounded-xl">
                                                <p className="text-slate-800 mb-2">{activity.description}</p>
                                                <p className="text-xs text-slate-400">
                                                    {formatDate(activity.createdDate)} by {activity.createdBy}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="space-y-4">
                                    {leadTasks.map((task) => (
                                        <div key={task.id} className="p-4 bg-slate-50 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-medium text-slate-800">{task.taskName}</p>
                                                <span
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${task.status === 'Completed'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                        }`}
                                                >
                                                    {task.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                                            <p className="text-xs text-slate-400">
                                                Due: {formatDate(task.dueDate)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'visits' && (
                                <div className="space-y-4">
                                    {leadVisits.length > 0 ? (
                                        leadVisits.map((visit) => {
                                            const Icon = getActivityIcon(visit.type);
                                            return (
                                                <div key={visit.id} className="flex gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                                                            <Icon size={18} className="text-orange-600" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-medium text-slate-800">{visit.title}</p>
                                                            <span className="text-xs text-slate-400">
                                                                {formatDate(visit.createdDate)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mb-1">{visit.description}</p>
                                                        {visit.visitDate && (
                                                            <p className="text-xs text-slate-400">Visit Date: {formatDate(visit.visitDate)}</p>
                                                        )}
                                                        {visit.location && (
                                                            <p className="text-xs text-slate-400">Location: {visit.location}</p>
                                                        )}
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            By: {visit.createdBy}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">No visits recorded yet</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Lead Groups, Campaigns, Tags */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    {/* Lead Groups */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 mb-3">Belongs to Lead Groups</p>
                        <div className="space-y-2">
                            {leadGroups.length > 0 ? (
                                leadGroups.map((group) => (
                                    <Link
                                        key={group.id}
                                        href={`/lead-groups/${group.id}`}
                                        className="block p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm text-slate-800"
                                    >
                                        {group.name}
                                    </Link>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No groups assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Campaigns */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 mb-3">Campaigns</p>
                        {leadCampaigns.length > 0 ? (
                            <div className="space-y-2">
                                {leadCampaigns.map((campaign) => {
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
                                        <Link
                                            key={campaign.id}
                                            href={`/campaigns/${campaign.id}`}
                                            className="block p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Megaphone size={14} className="text-slate-500" />
                                                <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                    {campaign.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                                                        campaign.type
                                                    )}`}
                                                >
                                                    {campaign.type}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${campaign.status === 'Active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {campaign.status}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">No campaigns yet</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 mb-3">Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {lead.tags.length > 0 ? (
                                lead.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No tags assigned</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

