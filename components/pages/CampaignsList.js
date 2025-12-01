'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Filter, Plus } from 'lucide-react';
import campaignsData from '../../data/campaigns.json';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../ui/button';

export default function CampaignsList() {
    const [campaigns] = useState(campaignsData);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
    });

    const filteredCampaigns = campaigns.filter((campaign) => {
        if (filters.type && campaign.type !== filters.type) return false;
        if (filters.status && campaign.status !== filters.status) return false;
        return true;
    });

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

    const getStatusColor = (status) => {
        return status === 'Active'
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Campaigns</h1>
                <Link href="/campaigns/new">
                    <Button className="flex items-center gap-2">
                        <Plus size={18} />
                        <span>Campaign</span>
                    </Button>
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
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="Call">Call</option>
                        <option value="Visit">Visit</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
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
                                    Lead Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Status
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
                            {filteredCampaigns.map((campaign) => (
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
                                                campaign.type
                                            )}`}
                                        >
                                            {campaign.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{campaign.leadCount}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                                                campaign.status
                                            )}`}
                                        >
                                            {campaign.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {formatDate(campaign.createdDate)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/campaigns/${campaign.id}`}
                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Eye size={16} />
                                            View
                                        </Link>
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

