'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchAll, updateById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/utils/formatDate';
import { toast } from 'sonner';

export default function NotificationDropdown({ userId, onClose, onNotificationChange }) {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await fetchAll('notifications', '*', {
                    user_id: userId,
                    is_deleted: false,
                });

                if (error) {
                    console.error('Error fetching notifications:', error);
                    return;
                }

                // Sort by created_at descending (newest first)
                const sorted = (data || []).sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );
                setNotifications(sorted);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();

        // Listen for real-time updates
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            const { error } = await updateById('notifications', notificationId, {
                is_read: true,
            });

            if (error) {
                toast.error('Error marking notification as read');
                return;
            }

            const updatedNotifications = notifications.map((notif) =>
                notif.id === notificationId ? { ...notif, is_read: true } : notif
            );
            setNotifications(updatedNotifications);

            // Update unread count in parent
            if (onNotificationChange) {
                const newUnreadCount = updatedNotifications.filter((n) => !n.is_read).length;
                onNotificationChange(newUnreadCount);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            const notification = notifications.find((n) => n.id === notificationId);
            const wasUnread = notification && !notification.is_read;

            const { error } = await updateById('notifications', notificationId, {
                is_deleted: true,
            });

            if (error) {
                toast.error('Error deleting notification');
                return;
            }

            const updatedNotifications = notifications.filter((notif) => notif.id !== notificationId);
            setNotifications(updatedNotifications);

            // Update unread count in parent
            if (onNotificationChange) {
                const newUnreadCount = updatedNotifications.filter((n) => !n.is_read).length;
                onNotificationChange(newUnreadCount);
            }

            toast.success('Notification deleted');
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadIds = notifications
                .filter((n) => !n.is_read)
                .map((n) => n.id);

            if (unreadIds.length === 0) return;

            // Update all unread notifications
            const updates = unreadIds.map((id) =>
                updateById('notifications', id, { is_read: true })
            );

            await Promise.all(updates);

            const updatedNotifications = notifications.map((notif) =>
                unreadIds.includes(notif.id) ? { ...notif, is_read: true } : notif
            );
            setNotifications(updatedNotifications);

            // Update unread count in parent
            if (onNotificationChange) {
                onNotificationChange(0);
            }

            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success':
                return CheckCircle;
            case 'warning':
                return AlertTriangle;
            case 'error':
                return AlertCircle;
            case 'info':
            default:
                return Info;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'warning':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'error':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'info':
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-[600px] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 select-none">
                <div className="flex items-center gap-2">
                    <Bell size={20} className="text-slate-600" />
                    <h3 className="font-semibold text-slate-800">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium select-none"
                        >
                            Tümünü Okundu İşaretle
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Bell size={48} className="mx-auto mb-2 text-slate-300" />
                        <p>Bildirim yok</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => {
                            const Icon = getTypeIcon(notification.type);
                            const isUnread = !notification.is_read;

                            return (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-slate-50 transition-colors select-none ${isUnread ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-lg border ${getTypeColor(
                                                notification.type
                                            )}`}
                                        >
                                            <Icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0 select-none">
                                            <p
                                                className={`text-sm select-none ${isUnread
                                                    ? 'font-semibold text-slate-900'
                                                    : 'text-slate-700'
                                                    }`}
                                            >
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 select-none">
                                                {formatDateTime(notification.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isUnread && (
                                                <button
                                                    onClick={() =>
                                                        handleMarkAsRead(notification.id)
                                                    }
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Okundu İşaretle"
                                                >
                                                    <Check size={16} className="text-slate-600" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} className="text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

