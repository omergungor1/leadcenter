'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Eye, Filter, Loader2, X } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll, updateById, insert } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function TasksList() {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState({}); // Map of lead_id -> lead data
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        dueToday: true, // Default true
        overdue: true, // Default true
    });
    const [completingTask, setCompletingTask] = useState(null);
    const [completionNote, setCompletionNote] = useState('');
    const [hasFollowUp, setHasFollowUp] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        content: '',
        due_date: '',
        due_time: '',
    });

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

    // Fetch tasks (activities with due_date)
    useEffect(() => {
        const fetchTasks = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                // Fetch all activities with due_date (these are tasks)
                const { data: activitiesData, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('user_id', userId)
                    .not('due_date', 'is', null)
                    .order('due_date', { ascending: true });

                if (error) {
                    toast.error('Görevler yüklenirken hata oluştu: ' + error.message);
                    return;
                }

                if (activitiesData) {
                    // Fetch lead data for each task
                    const leadIds = [...new Set(activitiesData.map((a) => a.lead_id))];
                    const leadsMap = {};

                    if (leadIds.length > 0) {
                        const { data: leadsData } = await supabase
                            .from('leads')
                            .select('id, company, name')
                            .in('id', leadIds);

                        if (leadsData) {
                            leadsData.forEach((lead) => {
                                leadsMap[lead.id] = lead;
                            });
                        }
                    }

                    setLeads(leadsMap);
                    setTasks(activitiesData);
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Görevler yüklenirken hata oluştu');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [userId]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const getActivityTypeLabel = (type) => {
        if (!type) return '-';
        const labels = {
            note: 'Not',
            email: 'Email',
            call: 'Call',
            whatsapp: 'WhatsApp',
            follow_up: 'Takip',
            visit: 'Ziyaret',
            meeting: 'Toplantı',
            todo: 'Görev',
        };
        return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const filteredTasks = tasks.filter((task) => {
        if (!task.due_date) return false; // Only show tasks with due_date

        // Status filter
        if (filters.status) {
            const taskStatus = task.status === 'pending' ? 'Pending' : 'Completed';
            if (taskStatus !== filters.status) return false;
        }

        // Type filter
        if (filters.type) {
            const taskType = getActivityTypeLabel(task.activity_type);
            if (taskType !== filters.type) return false;
        }

        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        const taskDueDateStr = taskDueDate.toISOString().split('T')[0];
        const isDueToday = taskDueDateStr === todayStr;
        const isOverdue = taskDueDate < today && task.status === 'pending';

        // Date filters (dueToday and overdue)
        if (filters.dueToday && filters.overdue) {
            // Show tasks that are due today OR overdue
            if (!isDueToday && !isOverdue) return false;
        } else if (filters.dueToday) {
            // Show only tasks due today
            if (!isDueToday) return false;
        } else if (filters.overdue) {
            // Show only overdue tasks
            if (!isOverdue) return false;
        }
        // If both are false, show all tasks (no date filter)

        return true;
    });

    const handleCompleteTask = async () => {
        if (!completingTask) return;

        // Validate follow-up if enabled
        if (hasFollowUp) {
            if (!followUpData.content.trim()) {
                toast.error('Takip notu gereklidir');
                return;
            }
            if (!followUpData.due_date) {
                toast.error('Takip tarihi gereklidir');
                return;
            }
        }

        try {
            // Update content with completion note
            const currentContent = completingTask.content || '';
            const resultText = completionNote.trim()
                ? `\n\nActivity Result: ${completionNote.trim()}`
                : '\n\nActivity Result: Completed';
            const updatedContent = currentContent + resultText;

            // Update activity
            const { error } = await updateById('activities', completingTask.id, {
                status: 'completed',
                content: updatedContent,
                completed_at: new Date().toISOString(),
            });

            if (error) {
                toast.error('Görev tamamlanırken hata oluştu: ' + error.message);
                return;
            }

            // If follow-up is enabled, create follow-up activity
            if (hasFollowUp) {
                const followUpDateTime = followUpData.due_date + (followUpData.due_time ? ' ' + followUpData.due_time : ' 00:00');

                const followUpActivityData = {
                    user_id: userId,
                    lead_id: completingTask.lead_id,
                    activity_type: 'follow_up',
                    content: followUpData.content,
                    status: 'pending',
                    due_date: new Date(followUpDateTime).toISOString(),
                    activity_reference_id: completingTask.id, // Reference to completed activity
                };

                const { error: followUpError } = await insert('activities', followUpActivityData);

                if (followUpError) {
                    toast.error('Error creating follow-up: ' + followUpError.message);
                    return;
                }
            }

            toast.success('Görev başarıyla tamamlandı!');

            // Update local state
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === completingTask.id
                        ? {
                            ...task,
                            status: 'completed',
                            content: updatedContent,
                            completed_at: new Date().toISOString(),
                        }
                        : task
                )
            );

            // Close modal and reset state
            setCompletingTask(null);
            setCompletionNote('');
            setHasFollowUp(false);
            setFollowUpData({
                content: '',
                due_date: '',
                due_time: '',
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu');
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-slate-500">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800">Görevler</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-slate-500" />
                    <span className="font-medium text-slate-700">Filtreler</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="Pending">Beklemede</option>
                        <option value="Completed">Tamamlandı</option>
                    </select>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tüm Türler</option>
                        <option value="Call">Telefon</option>
                        <option value="Email">E-posta</option>
                        <option value="Follow Up">Takip</option>
                        <option value="Visit">Ziyaret</option>
                        <option value="Meeting">Toplantı</option>
                        <option value="Todo">Görev</option>
                        <option value="WhatsApp">WhatsApp</option>
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input
                            type="checkbox"
                            checked={filters.dueToday}
                            onChange={(e) => setFilters({ ...filters, dueToday: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm">Bugüne Kadar</span>
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input
                            type="checkbox"
                            checked={filters.overdue}
                            onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
                            className="rounded"
                        />
                        <span className="text-sm">Geçmiş</span>
                    </label>
                    <button
                        onClick={() =>
                            setFilters({ status: '', type: '', dueToday: true, overdue: true })
                        }
                        className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Filtreleri Temizle
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
                                    Görev İçeriği
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    İlişkili Müşteri
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Bitiş Tarihi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Tür
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => {
                                    const lead = leads[task.lead_id];
                                    const isOverdue =
                                        task.due_date &&
                                        new Date(task.due_date) < today &&
                                        task.status === 'pending';

                                    return (
                                        <tr key={task.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800 max-w-md truncate">
                                                    {task.content || 'Açıklama yok'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead ? (
                                                    <Link
                                                        href={`/leads/${task.lead_id}`}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        {lead.company || lead.name || 'İlişkili Müşteri Yok'}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">Yükleniyor...</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                                    {task.due_date ? formatDate(task.due_date) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                                                        task.status
                                                    )}`}
                                                >
                                                    {task.status === 'pending' ? 'Beklemede' : 'Tamamlandı'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {getActivityTypeLabel(task.activity_type)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {task.status === 'pending' && (
                                                        <button
                                                            onClick={() => setCompletingTask(task)}
                                                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                                                        >
                                                            <CheckCircle size={16} />
                                                            Tamamla
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/leads/${task.lead_id}`}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <Eye size={16} />
                                                        Görüntüle
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Görev bulunamadı
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Complete Task Modal */}
            {completingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Görev Tamamla</h3>
                            <button
                                onClick={() => {
                                    setCompletingTask(null);
                                    setCompletionNote('');
                                    setHasFollowUp(false);
                                    setFollowUpData({
                                        content: '',
                                        due_date: '',
                                        due_time: '',
                                    });
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tamamlama Notu
                                </label>
                                <textarea
                                    value={completionNote}
                                    onChange={(e) => setCompletionNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={4}
                                    placeholder="Tamamlama notu (isteğe bağlı)..."
                                />
                            </div>

                            {/* Follow up checkbox */}
                            <div className="space-y-3 pt-2 border-t border-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasFollowUp}
                                        onChange={(e) => setHasFollowUp(e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Takip Ekle</span>
                                </label>

                                {hasFollowUp && (
                                    <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Takip Açıklaması <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={followUpData.content}
                                                onChange={(e) => setFollowUpData({ ...followUpData, content: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                rows={3}
                                                placeholder="Takip açıklaması..."
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Takip Tarihi <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={followUpData.due_date}
                                                    onChange={(e) => setFollowUpData({ ...followUpData, due_date: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Takip Saati <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="time"
                                                    value={followUpData.due_time}
                                                    onChange={(e) => setFollowUpData({ ...followUpData, due_time: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setCompletingTask(null);
                                        setCompletionNote('');
                                        setHasFollowUp(false);
                                        setFollowUpData({
                                            content: '',
                                            due_date: '',
                                            due_time: '',
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCompleteTask}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                                >
                                    Görevi Tamamla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
