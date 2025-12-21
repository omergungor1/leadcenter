'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Phone, Mail, MapPin, Save, Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchAll, fetchById, insert, updateById, deleteById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [dailyLimits, setDailyLimits] = useState({
        whatsapp: 100,
        call: 30,
        email: 100,
        visit: 10,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tags, setTags] = useState([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [tagForm, setTagForm] = useState({
        name: '',
        color: '#3B82F6',
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

    // Fetch daily limits and tags
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                // Fetch user limits
                const { data: userData, error: userError } = await fetchById('users', userId);
                if (userData && !userError) {
                    setDailyLimits({
                        whatsapp: userData.whatsapp_limit || 100,
                        call: userData.call_limit || 30,
                        email: userData.mail_limit || 100,
                        visit: userData.visit_limit || 10,
                    });
                }

                // Fetch tags
                const { data: tagsData, error: tagsError } = await fetchAll('lead_tags', '*', {
                    user_id: userId,
                    is_active: true,
                });
                if (tagsData && !tagsError) {
                    setTags(tagsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleLimitChange = (type, value) => {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0) {
            setDailyLimits({
                ...dailyLimits,
                [type]: numValue,
            });
        }
    };

    const handleSave = async () => {
        if (!userId) {
            toast.error('Kullanıcı bulunamadı. Lütfen tekrar deneyin.');
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await updateById('users', userId, {
                whatsapp_limit: dailyLimits.whatsapp,
                call_limit: dailyLimits.call,
                mail_limit: dailyLimits.email,
                visit_limit: dailyLimits.visit,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                toast.error('Günlük limitler güncellenirken hata oluştu: ' + error.message);
            } else {
                toast.success('Günlük limitler başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Kaydederken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSaving(false);
        }
    };

    const limitItems = [
        {
            key: 'whatsapp',
            label: 'WhatsApp',
            icon: MessageSquare,
            color: 'green',
            description: 'Günlük WhatsApp mesaj limiti',
        },
        {
            key: 'call',
            label: 'Telefon',
            icon: Phone,
            color: 'blue',
            description: 'Günlük telefon araması limiti',
        },
        {
            key: 'email',
            label: 'E-posta',
            icon: Mail,
            color: 'purple',
            description: 'Günlük e-posta limiti',
        },
        {
            key: 'visit',
            label: 'Ziyaret',
            icon: MapPin,
            color: 'orange',
            description: 'Günlük ziyaret limiti',
        },
    ];

    const getColorClasses = (color) => {
        switch (color) {
            case 'green':
                return 'bg-green-50 text-green-600';
            case 'blue':
                return 'bg-blue-50 text-blue-600';
            case 'purple':
                return 'bg-purple-50 text-purple-600';
            case 'orange':
                return 'bg-orange-50 text-orange-600';
            default:
                return 'bg-slate-50 text-slate-600';
        }
    };

    // Tag Management Functions
    const handleOpenTagModal = (tag = null) => {
        if (tag) {
            setEditingTag(tag);
            setTagForm({
                name: tag.name,
                color: tag.color || '#3B82F6',
            });
        } else {
            setEditingTag(null);
            setTagForm({
                name: '',
                color: '#3B82F6',
            });
        }
        setShowTagModal(true);
    };

    const handleCloseTagModal = () => {
        setShowTagModal(false);
        setEditingTag(null);
        setTagForm({
            name: '',
            color: '#3B82F6',
        });
    };

    const handleSaveTag = async () => {
        if (!tagForm.name.trim()) {
            toast.error('Etiket adı gereklidir');
            return;
        }

        if (!userId) {
            toast.error('Kullanıcı bulunamadı. Lütfen tekrar deneyin.');
            return;
        }

        try {
            if (editingTag) {
                // Update existing tag
                const { data, error } = await updateById('lead_tags', editingTag.id, {
                    name: tagForm.name,
                    color: tagForm.color,
                    updated_at: new Date().toISOString(),
                });

                if (error) {
                    toast.error('Etiket güncellenirken hata oluştu: ' + error.message);
                    return;
                }

                setTags(tags.map((tag) =>
                    tag.id === editingTag.id ? { ...tag, ...data } : tag
                ));
                toast.success('Etiket başarıyla güncellendi!');
            } else {
                // Create new tag
                const { data, error } = await insert('lead_tags', {
                    user_id: userId,
                    name: tagForm.name,
                    color: tagForm.color,
                    is_active: true,
                });

                if (error) {
                    toast.error('Etiket oluşturulurken hata oluştu: ' + error.message);
                    return;
                }

                setTags([...tags, data]);
                toast.success('Etiket başarıyla oluşturuldu!');
            }
            handleCloseTagModal();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const handleDeleteTag = async (tagId) => {
        if (!confirm('Bu etiketi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            // Soft delete by setting is_active to false
            const { data, error } = await updateById('lead_tags', tagId, {
                is_active: false,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                toast.error('Etiket silinirken hata oluştu: ' + error.message);
                return;
            }

            setTags(tags.filter((tag) => tag.id !== tagId));
            toast.success('Etiket başarıyla silindi!');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
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
            <h1 className="text-3xl font-bold text-slate-800">Ayarlar</h1>

            {/* Daily Limits Panel */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Günlük Limitler ve Hedefler</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Her kampanya türü için günlük limitler belirleyin
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {limitItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className="p-6 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl ${getColorClasses(item.color)}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800">{item.label}</h3>
                                        <p className="text-sm text-slate-500">{item.description}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Günlük Limit
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={dailyLimits[item.key]}
                                            onChange={(e) => handleLimitChange(item.key, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                        <span className="text-slate-500 font-medium">/ gün</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tag Management Panel */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Etiket Yönetimi</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Müşteriler için etiketler oluşturun, düzenleyin ve silin
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenTagModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        <span>Etiket Ekle</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tags.map((tag) => (
                        <div
                            key={tag.id}
                            className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg"
                                        style={{ backgroundColor: tag.color || '#3B82F6' }}
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-800">{tag.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {formatDate(tag.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenTagModal(tag)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Etiketi düzenle"
                                    >
                                        <Edit2 size={16} className="text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTag(tag.id)}
                                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Etiketi sil"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-3 py-1 rounded-lg text-xs font-medium"
                                    style={{
                                        backgroundColor: `${tag.color || '#3B82F6'}20`,
                                        color: tag.color || '#3B82F6',
                                    }}
                                >
                                    {tag.name}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tag Modal */}
            {showTagModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleCloseTagModal}
                >
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-slate-800">
                                {editingTag ? 'Etiketi Düzenle' : 'Etiket Oluştur'}
                            </h3>
                            <button
                                onClick={handleCloseTagModal}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Etiket Adı <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={tagForm.name}
                                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="örn: Premium, VIP"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Renk <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={tagForm.color}
                                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                                        className="w-16 h-10 rounded-lg cursor-pointer border border-slate-200"
                                    />
                                    <input
                                        type="text"
                                        value={tagForm.color}
                                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="#3B82F6"
                                    />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span
                                        className="px-3 py-1 rounded-lg text-xs font-medium"
                                        style={{
                                            backgroundColor: `${tagForm.color}20`,
                                            color: tagForm.color,
                                        }}
                                    >
                                        Önizleme
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseTagModal}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveTag}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                            >
                                {editingTag ? 'Güncelle' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
