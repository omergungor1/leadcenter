'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Download, Plus, ChevronDown, FileText, Contact } from 'lucide-react';
import leadGroupsData from '../../data/leadGroups.json';
import leadsData from '../../data/leads.json';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function LeadGroupsList() {
    const [leadGroups] = useState(leadGroupsData);

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

    const handleExportCSV = (groupId) => {
        // Mock: Export to CSV
        alert(`Exporting group ${groupId} to CSV... (Mock)`);
    };

    const handleExportVCF = (groupId) => {
        // Mock: Export to VCF
        alert(`Exporting group ${groupId} to VCF... (Mock)`);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Lead Groups</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium">
                    <Plus size={18} />
                    <span>Create Lead Group</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Group Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Lead Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Date Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {leadGroups.map((group) => (
                                <tr key={group.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/lead-groups/${group.id}`}
                                            className="font-medium text-slate-800 hover:text-blue-600"
                                        >
                                            {group.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                                                group.status
                                            )}`}
                                        >
                                            {group.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                        {group.leadCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {formatDate(group.dateCreated)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/lead-groups/${group.id}`}
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <Eye size={16} />
                                                View
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm"
                                                        className="focus-visible:outline-none focus-visible:ring-0"
                                                    >
                                                        <Download size={16} />
                                                        Export
                                                        <ChevronDown size={14} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 bg-white">
                                                    <DropdownMenuItem
                                                        onClick={() => handleExportCSV(group.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span>Export .csv</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleExportVCF(group.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Contact className="mr-2 h-4 w-4" />
                                                        <span>Export .vcf</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

