'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Eye, Plus, Filter } from 'lucide-react';
import tasksData from '../../data/tasks.json';
import leadsData from '../../data/leads.json';
import { formatDate } from '../../utils/formatDate';

export default function TasksList() {
    const [tasks] = useState(tasksData);
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        dueToday: false,
        overdue: false,
    });

    const today = new Date().toISOString().split('T')[0];

    const filteredTasks = tasks.filter((task) => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.type && task.type !== filters.type) return false;
        if (filters.dueToday && task.dueDate.split('T')[0] !== today) return false;
        if (filters.overdue && new Date(task.dueDate) > new Date() && task.status !== 'Completed')
            return false;
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Tasks</h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium">
                    <Plus size={18} />
                    <span>Create Task</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-slate-500" />
                    <span className="font-medium text-slate-700">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Visit">Visit</option>
                        <option value="Custom">Custom</option>
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input
                            type="checkbox"
                            checked={filters.dueToday}
                            onChange={(e) => setFilters({ ...filters, dueToday: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm">Due Today</span>
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input
                            type="checkbox"
                            checked={filters.overdue}
                            onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm">Overdue</span>
                    </label>
                    <button
                        onClick={() =>
                            setFilters({ status: '', type: '', dueToday: false, overdue: false })
                        }
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Task Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Related Lead
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-800">{task.taskName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/leads/${task.relatedLeadId}`}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            {task.relatedLeadName}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {formatDate(task.dueDate)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                                                task.status
                                            )}`}
                                        >
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{task.type}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {task.status !== 'Completed' && (
                                                <button className="text-green-600 hover:text-green-800 flex items-center gap-1">
                                                    <CheckCircle size={16} />
                                                    Complete
                                                </button>
                                            )}
                                            <Link
                                                href={`/leads/${task.relatedLeadId}`}
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <Eye size={16} />
                                                View
                                            </Link>
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

