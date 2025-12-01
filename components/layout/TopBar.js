'use client';

import { useState } from 'react';
import { Search, Bell, User, Plus, X } from 'lucide-react';
import CreateModal from '../modals/CreateModal';

export default function TopBar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <>
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search leads, groups, campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                        />
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {/* Create Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                        >
                            <Plus size={18} />
                            <span>Create</span>
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <Bell size={20} className="text-slate-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* Profile */}
                        <button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                JD
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateModal onClose={() => setShowCreateModal(false)} />
            )}
        </>
    );
}

