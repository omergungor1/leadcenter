'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, Plus, X, LogOut, Loader2 } from 'lucide-react';
import CreateModal from '../modals/CreateModal';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useAuth } from '@/lib/supabase/hooks';
import { signOut } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { fetchAll } from '@/lib/supabase/database';

export default function TopBar() {
    const router = useRouter();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [userId, setUserId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const notificationRef = useRef(null);
    const searchRef = useRef(null);

    const handleLogout = async () => {
        const { error } = await signOut();
        if (!error) {
            router.push('/login');
            router.refresh();
        }
    };

    // Fetch user ID from users table
    useEffect(() => {
        const fetchUserId = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user:', error);
                    return;
                }

                if (data) {
                    setUserId(data.id);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchUserId();
    }, [user]);

    // Fetch unread notifications count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!userId) return;

            try {
                const { data, error } = await fetchAll('notifications', '*', {
                    user_id: userId,
                    is_read: false,
                    is_deleted: false,
                });

                if (error) {
                    console.error('Error fetching notifications:', error);
                    return;
                }

                setUnreadCount(data?.length || 0);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchUnreadCount();

        // Listen for real-time updates
        if (userId) {
            const channel = supabase
                .channel('notifications-count')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    () => {
                        fetchUnreadCount();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [userId]);

    // Search leads with debounce
    const searchLeads = useCallback(
        async (query) => {
            if (!query.trim() || !userId) {
                setSearchResults([]);
                setShowSearchDropdown(false);
                return;
            }

            setIsSearching(true);
            setShowSearchDropdown(true);
            try {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, company, name, city, district, phone, business_type')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .or(
                        `company.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%,district.ilike.%${query}%,business_type.ilike.%${query}%`
                    )
                    .limit(10);

                if (error) {
                    console.error('Error searching leads:', error);
                    return;
                }

                setSearchResults(data || []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsSearching(false);
            }
        },
        [userId]
    );

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchLeads(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchLeads]);

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target) &&
                !event.target.closest('[data-search-input]')
            ) {
                setShowSearchDropdown(false);
            }
        };

        if (showSearchDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearchDropdown]);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target) &&
                !event.target.closest('[data-notification-button]')
            ) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    const handleLeadClick = (leadId) => {
        router.push(`/leads/${leadId}`);
        setShowSearchDropdown(false);
        setSearchQuery('');
    };

    const getUserInitials = () => {
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <>
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-md relative" ref={searchRef}>
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10" size={20} />
                        <input
                            data-search-input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchQuery && searchResults.length > 0) {
                                    setShowSearchDropdown(true);
                                }
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                        />

                        {/* Search Results Dropdown */}
                        {showSearchDropdown && searchQuery && (
                            <div className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg z-50">
                                {isSearching ? (
                                    <div className="p-4 text-center text-slate-500">
                                        <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                                        <span className="text-sm">Searching...</span>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="divide-y divide-slate-200">
                                        {searchResults.map((lead) => (
                                            <div
                                                key={lead.id}
                                                onClick={() => handleLeadClick(lead.id)}
                                                className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800 text-sm">
                                                        {lead.company || lead.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {lead.business_type ? `${lead.business_type} - ` : ''}
                                                        {lead.city || '-'}
                                                        {lead.district ? ` / ${lead.district}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No leads found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {/* Create Button */}
                        {/* <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                        >
                            <Plus size={18} />
                            <span>Create</span>
                        </button> */}

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                data-notification-button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <Bell size={20} className="text-slate-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && userId && (
                                <div className="absolute right-0 top-full mt-2 z-50">
                                    <NotificationDropdown
                                        userId={userId}
                                        onClose={() => setShowNotifications(false)}
                                        onNotificationChange={(newCount) => setUnreadCount(newCount)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                    {getUserInitials()}
                                </div>
                            </button>

                            {/* Profile Dropdown */}
                            {showProfileMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowProfileMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                                        <div className="px-4 py-2 border-b border-slate-200">
                                            <p className="text-sm font-medium text-slate-800">
                                                {user?.email.substring(0, 20) || 'User'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
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

