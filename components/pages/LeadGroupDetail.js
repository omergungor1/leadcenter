'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft, ChevronDown, FileText, Contact } from 'lucide-react';
import Link from 'next/link';
import leadGroupsData from '../../data/leadGroups.json';
import leadsData from '../../data/leads.json';
import activitiesData from '../../data/activities.json';
import { formatDate } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function LeadGroupDetail({ id }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('leads');
    const group = leadGroupsData.find((g) => g.id === id);
    const groupLeads = leadsData.filter((lead) => lead.leadGroupIds?.includes(id));
    const groupActivities = activitiesData.filter((activity) =>
        groupLeads.some((lead) => lead.id === activity.leadId)
    );

    if (!group) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Lead group not found</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-700';
            case 'Processing':
                return 'bg-blue-100 text-blue-700';
            case 'Pending':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const handleExportCSV = () => {
        // Mock: Export to CSV
        alert(`Exporting group ${id} to CSV... (Mock)`);
    };

    const handleExportVCF = () => {
        // Mock: Export to VCF
        alert(`Exporting group ${id} to VCF... (Mock)`);
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
                    <h1 className="text-3xl font-bold text-slate-800">{group.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
                                group.status
                            )}`}
                        >
                            {group.status}
                        </span>
                        <span className="text-slate-600">{group.leadCount} leads</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="default" className="focus-visible:outline-none focus-visible:ring-0">
                                <Download size={18} />
                                <span>Export</span>
                                <ChevronDown size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white">
                            <DropdownMenuItem
                                onClick={handleExportCSV}
                                className="cursor-pointer"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Export .csv</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleExportVCF}
                                className="cursor-pointer"
                            >
                                <Contact className="mr-2 h-4 w-4" />
                                <span>Export .vcf</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {['leads', 'notes', 'history'].map((tab) => (
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                {activeTab === 'leads' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Company Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {groupLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="font-medium text-slate-800 hover:text-blue-600"
                                            >
                                                {lead.companyName}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{lead.category}</td>
                                        <td className="px-6 py-4 text-slate-600">{formatPhoneNumber(lead.phone)}</td>
                                        <td className="px-6 py-4 text-slate-600">{lead.email}</td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-slate-800 font-medium mb-1">Group Notes</p>
                                <p className="text-slate-600 text-sm">{group.description}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Created: {formatDate(group.dateCreated)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="p-6">
                        <div className="space-y-4">
                            {groupActivities.length > 0 ? (
                                groupActivities.map((activity) => (
                                    <div key={activity.id} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-slate-800">{activity.title}</p>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(activity.createdDate)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{activity.description}</p>
                                        <p className="text-xs text-slate-400 mt-1">By: {activity.createdBy}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">No history available</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

