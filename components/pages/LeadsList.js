'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Filter } from 'lucide-react';
import leadsData from '../../data/leads.json';
import leadGroupsData from '../../data/leadGroups.json';
import { formatDate } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

export default function LeadsList() {
    const [leads] = useState(leadsData);
    const [filters, setFilters] = useState({
        leadGroup: '',
        city: '',
        category: '',
        activity: '',
    });

    const filteredLeads = leads.filter((lead) => {
        if (filters.leadGroup && lead.sourceGroup !== filters.leadGroup) return false;
        if (filters.city && lead.city !== filters.city) return false;
        if (filters.category && lead.category !== filters.category) return false;
        return true;
    });

    const uniqueCities = [...new Set(leads.map((lead) => lead.city))];
    const uniqueCategories = [...new Set(leads.map((lead) => lead.category))];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Leads</h1>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-slate-500" />
                    <span className="font-medium text-slate-700">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                        value={filters.leadGroup}
                        onChange={(e) => setFilters({ ...filters, leadGroup: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Lead Groups</option>
                        {leadGroupsData.map((group) => (
                            <option key={group.id} value={group.name}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Cities</option>
                        {uniqueCities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setFilters({ leadGroup: '', city: '', category: '', activity: '' })}
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                                    City / District
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Source Group
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Last Activity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredLeads.map((lead) => (
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
                                    <td className="px-6 py-4 text-slate-600">
                                        {lead.city} / {lead.district}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{lead.sourceGroup}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {formatDate(lead.lastActivity)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/leads/${lead.id}`}
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

