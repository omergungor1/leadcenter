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
} from 'lucide-react';
import Link from 'next/link';
import leadsData from '../../data/leads.json';
import leadGroupsData from '../../data/leadGroups.json';
import activitiesData from '../../data/activities.json';
import tasksData from '../../data/tasks.json';
import { formatDate } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

export default function LeadDetail({ id }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('activity');
    const lead = leadsData.find((l) => l.id === id);
    const leadActivities = activitiesData.filter((a) => a.leadId === id);
    const leadTasks = tasksData.filter((t) => t.relatedLeadId === id);
    const leadGroups = leadGroupsData.filter((g) => lead?.leadGroupIds?.includes(g.id));

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
            default:
                return FileText;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
            >
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Info Panel */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
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
                                <div>
                                    <p className="text-sm text-slate-500">Phone</p>
                                    <p className="text-slate-800">{formatPhoneNumber(lead.phone)}</p>
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

                            <div>
                                <p className="text-sm text-slate-500 mb-2">Belongs to Lead Groups</p>
                                <div className="space-y-1">
                                    {leadGroups.map((group) => (
                                        <Link
                                            key={group.id}
                                            href={`/lead-groups/${group.id}`}
                                            className="block text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            {group.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 mb-2">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column - Activity Timeline */}
                <div className="col-span-12 lg:col-span-6 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        {/* Tabs */}
                        <div className="border-b border-slate-200">
                            <nav className="flex space-x-8 px-6">
                                {['activity', 'notes', 'emails', 'calls', 'whatsapp', 'tasks', 'meetings'].map(
                                    (tab) => (
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
                                    )
                                )}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'activity' && (
                                <div className="space-y-4">
                                    {leadActivities.length > 0 ? (
                                        leadActivities.map((activity) => {
                                            const Icon = getActivityIcon(activity.type);
                                            return (
                                                <div key={activity.id} className="flex gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                            <Icon size={18} className="text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-medium text-slate-800">{activity.title}</p>
                                                            <span className="text-xs text-slate-400">
                                                                {formatDate(activity.createdDate)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mb-1">{activity.description}</p>
                                                        {activity.duration && (
                                                            <p className="text-xs text-slate-400">Duration: {activity.duration}</p>
                                                        )}
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            By: {activity.createdBy}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
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
                        </div>
                    </div>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <FileText size={18} />
                            <span>Add Note</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <MailIcon size={18} />
                            <span>Log Email</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <PhoneCall size={18} />
                            <span>Log Call</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <CheckSquare size={18} />
                            <span>Add Task</span>
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                            <Calendar size={18} />
                            <span>Add Meeting</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

