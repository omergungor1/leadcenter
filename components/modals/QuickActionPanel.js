'use client';

import { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, FileText, Mail, PhoneCall, MapPin, Calendar, CheckSquare, Save, MessageSquare } from 'lucide-react';
import { insert } from '@/lib/supabase/database';
import { toast } from 'sonner';

export default function QuickActionPanel({ lead, userId, campaignId = null, onClose, onActivityAdded, initialActionType = null }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [actionType, setActionType] = useState(initialActionType); // 'note', 'email', 'call', 'visit', 'meeting', 'task'
    const [taskType, setTaskType] = useState(''); // For task selection
    const [formData, setFormData] = useState({
        content: '',
        due_date: '',
        due_time: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasFollowUp, setHasFollowUp] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        content: '',
        due_date: '',
        due_time: '',
    });

    // Set initial action type when prop changes
    useEffect(() => {
        if (initialActionType) {
            setActionType(initialActionType);
        }
    }, [initialActionType]);

    const handleActionClick = (type) => {
        if (type === 'task') {
            setActionType('task');
            setTaskType('');
        } else if (type === 'todo') {
            // Todo is a direct action, not a task type
            setActionType('todo');
        } else {
            setActionType(type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.content.trim() && actionType !== 'call' && actionType !== 'task') {
            toast.error('İçerik gereklidir');
            return;
        }

        if (actionType === 'task' && !taskType) {
            toast.error('Lütfen bir görev tipi seçin');
            return;
        }

        if ((actionType === 'meeting' || actionType === 'task' || actionType === 'todo') && !formData.due_date) {
            const typeLabel = actionType === 'meeting' ? 'toplantı' : actionType === 'todo' ? 'görev' : 'görev';
            toast.error(typeLabel + ' için tarih gereklidir');
            return;
        }

        // Validate follow-up if enabled
        if (hasFollowUp) {
            if (!followUpData.content.trim()) {
                toast.error('Takip açıklaması gereklidir');
                return;
            }
            if (!followUpData.due_date) {
                toast.error('Takip tarihi gereklidir');
                return;
            }
        }

        setIsSaving(true);
        try {
            // Determine status based on activity type
            const completedTypes = ['note', 'email', 'call', 'visit', 'whatsapp'];
            const finalActivityType = actionType === 'task' ? taskType : actionType;
            const isCompleted = completedTypes.includes(finalActivityType);

            const activityData = {
                user_id: userId,
                lead_id: lead.id,
                activity_type: finalActivityType,
                content: formData.content,
            };

            // Kampanya ID'si varsa ekle
            if (campaignId) {
                activityData.campaign_id = campaignId;
            }

            // Add due_date for meeting, task, and todo
            if (actionType === 'meeting' || actionType === 'task' || actionType === 'todo') {
                if (formData.due_date) {
                    const dateTime = formData.due_date + (formData.due_time ? ' ' + formData.due_time : ' 00:00');
                    activityData.due_date = new Date(dateTime).toISOString();
                }
            }

            // Task types and todo are always pending
            if (actionType === 'task' || actionType === 'todo') {
                activityData.status = 'pending';
            } else {
                activityData.status = isCompleted ? 'completed' : 'pending';
            }

            // Insert main activity
            const { data: mainActivity, error: mainError } = await insert('activities', activityData);

            if (mainError) {
                toast.error('Aktivite oluşturulurken hata oluştu: ' + mainError.message);
                return;
            }

            // If follow-up is enabled, create follow-up activity
            if (hasFollowUp && mainActivity) {
                const followUpDateTime = followUpData.due_date + (followUpData.due_time ? ' ' + followUpData.due_time : ' 00:00');

                const followUpActivityData = {
                    user_id: userId,
                    lead_id: lead.id,
                    activity_type: 'follow_up',
                    content: followUpData.content,
                    status: 'pending',
                    due_date: new Date(followUpDateTime).toISOString(),
                    activity_reference_id: mainActivity.id, // Reference to main activity
                };

                const { error: followUpError } = await insert('activities', followUpActivityData);

                if (followUpError) {
                    toast.error('Takip oluşturulurken hata oluştu: ' + followUpError.message);
                    return;
                }
            }

            toast.success('Aktivite başarıyla oluşturuldu!');
            onActivityAdded?.();
            handleClose();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSaving(false);
        }
    };

    const getDefaultTitle = (type) => {
        const titles = {
            note: 'Not',
            email: 'E-posta',
            call: 'Arama',
            visit: 'Ziyaret',
            meeting: 'Toplantı',
            follow_up: 'Takip',
            whatsapp: 'WhatsApp',
            todo: 'Görev',
        };
        return titles[type] || 'Aktivite';
    };

    const handleClose = () => {
        setActionType(null);
        setTaskType('');
        setFormData({
            content: '',
            due_date: '',
            due_time: '',
        });
        setHasFollowUp(false);
        setFollowUpData({
            content: '',
            due_date: '',
            due_time: '',
        });
        onClose();
    };

    const getActionIcon = (type) => {
        switch (type) {
            case 'note':
                return FileText;
            case 'email':
                return Mail;
            case 'call':
                return PhoneCall;
            case 'visit':
                return MapPin;
            case 'meeting':
                return Calendar;
            case 'task':
                return CheckSquare;
            case 'whatsapp':
                return MessageSquare;
            case 'todo':
                return CheckSquare;
            default:
                return FileText;
        }
    };

    const getActionColor = (type) => {
        switch (type) {
            case 'note':
                return 'bg-blue-100 text-blue-600';
            case 'email':
                return 'bg-blue-100 text-blue-600';
            case 'call':
                return 'bg-purple-100 text-purple-600';
            case 'visit':
                return 'bg-orange-100 text-orange-600';
            case 'meeting':
                return 'bg-indigo-100 text-indigo-600';
            case 'task':
                return 'bg-orange-100 text-orange-600';
            case 'whatsapp':
                return 'bg-green-100 text-green-600';
            case 'todo':
                return 'bg-yellow-100 text-yellow-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-slate-200 z-50 w-80">
                <div className="flex items-center justify-between p-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        {actionType && (() => {
                            const Icon = getActionIcon(actionType === 'task' ? taskType : actionType);
                            return <Icon size={18} className={getActionColor(actionType === 'task' ? taskType : actionType).split(' ')[1]} />;
                        })()}
                        <span className="text-sm font-medium text-slate-800">
                            {actionType === 'task' ? 'Görev' : actionType ? getDefaultTitle(actionType) : 'Hızlı İşlemler'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Büyüt"
                        >
                            <Maximize2 size={16} className="text-slate-600" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Kapat"
                        >
                            <X size={16} className="text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-slate-200 z-50 w-96 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                <div>
                    <h3 className="font-semibold text-slate-800">
                        {actionType ? (
                            <>
                                {actionType === 'task'
                                    ? 'Görev Oluştur'
                                    : actionType === 'whatsapp'
                                        ? 'WhatsApp Mesajı Ekle'
                                        : `${getDefaultTitle(actionType)} Ekle`}
                            </>
                        ) : (
                            'Hızlı İşlemler'
                        )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {lead.company || lead.name}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Küçült"
                    >
                        <Minimize2 size={18} className="text-slate-600" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Kapat"
                    >
                        <X size={18} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!actionType ? (
                    // Action Selection
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { type: 'note', label: 'Not', icon: FileText },
                            { type: 'email', label: 'E-posta', icon: Mail },
                            { type: 'call', label: 'Arama', icon: PhoneCall },
                            { type: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                            { type: 'visit', label: 'Ziyaret', icon: MapPin },
                            { type: 'meeting', label: 'Toplantı', icon: Calendar },
                            { type: 'task', label: 'Görev', icon: CheckSquare },
                            { type: 'todo', label: 'Görev', icon: CheckSquare },
                        ].map((action) => {
                            const Icon = action.icon;
                            const colorClass = getActionColor(action.type);
                            return (
                                <button
                                    key={action.type}
                                    onClick={() => handleActionClick(action.type)}
                                    className="flex flex-col items-center gap-2 p-3 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-700">{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : actionType === 'task' && !taskType ? (
                    // Task Type Selection
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700 mb-3">Görev Tipi Seçin:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['email', 'call', 'visit', 'todo'].map((type) => {
                                const Icon = getActionIcon(type);
                                const colorClass = getActionColor(type);
                                const typeLabels = {
                                    email: 'E-posta',
                                    call: 'Arama',
                                    visit: 'Ziyaret',
                                    todo: 'Görev',
                                };
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setTaskType(type)}
                                        className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                    >
                                        <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">
                                            {typeLabels[type] || type}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // Activity Form
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {actionType === 'call'
                                    ? 'Arama Notları'
                                    : actionType === 'whatsapp'
                                        ? 'WhatsApp Mesajı'
                                        : actionType === 'email'
                                            ? 'E-posta İçeriği'
                                            : actionType === 'note'
                                                ? 'Not'
                                                : actionType === 'visit'
                                                    ? 'Ziyaret Detayları'
                                                    : actionType === 'todo'
                                                        ? 'Görev Açıklaması'
                                                        : 'İçerik'} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                rows={actionType === 'call' ? 3 : 5}
                                placeholder={
                                    actionType === 'call'
                                        ? 'Arama notları...'
                                        : actionType === 'email'
                                            ? 'E-posta içeriği...'
                                            : actionType === 'whatsapp'
                                                ? 'WhatsApp mesaj içeriği...'
                                                : actionType === 'note'
                                                    ? 'Not içeriği...'
                                                    : actionType === 'visit'
                                                        ? 'Ziyaret detayları...'
                                                        : actionType === 'todo'
                                                            ? 'Görev açıklaması...'
                                                            : 'Detayları girin...'
                                }
                                required={actionType !== 'call'}
                            />
                        </div>

                        {(actionType === 'meeting' || actionType === 'task' || actionType === 'todo') && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tarih <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Saat <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.due_time}
                                        onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        )}

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
                                            placeholder="Takip açıklamasını girin..."
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

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (actionType === 'task' && taskType) {
                                        setTaskType('');
                                    } else {
                                        setActionType(null);
                                    }
                                }}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                            >
                                Geri
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Kaydediliyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Kaydet</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

