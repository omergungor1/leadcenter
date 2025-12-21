'use client';

import { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, Building2, Briefcase, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchById, updateById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { formatPhoneNumber, unformatPhoneNumber } from '@/utils/formatPhoneNumber';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        industry: '',
        role: '',
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

    // Fetch user profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;

            setIsLoading(true);
            try {
                const { data, error } = await fetchById('users', userId);

                if (error) {
                    toast.error('Profil yüklenirken hata oluştu: ' + error.message);
                    return;
                }

                if (data) {
                    setFormData({
                        name: data.name || '',
                        email: data.email || user?.email || '',
                        phone: data.phone ? formatPhoneNumber(data.phone) : '',
                        company_name: data.company_name || '',
                        industry: data.industry || '',
                        role: data.role || '',
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Profil yüklenirken bir hata oluştu');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userId, user]);

    const handleInputChange = (field, value) => {
        if (field === 'phone') {
            // Format phone number on input
            const formatted = formatPhoneNumber(value);
            setFormData({ ...formData, [field]: formatted });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            toast.error('Kullanıcı bulunamadı. Lütfen tekrar deneyin.');
            return;
        }

        setIsSaving(true);
        try {
            // Unformat phone number before saving
            const phoneToSave = unformatPhoneNumber(formData.phone);

            const { data, error } = await updateById('users', userId, {
                name: formData.name,
                phone: phoneToSave,
                company_name: formData.company_name,
                industry: formData.industry,
                role: formData.role,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                toast.error('Profil güncellenirken hata oluştu: ' + error.message);
            } else {
                toast.success('Profil başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Kaydederken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSaving(false);
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
            <h1 className="text-3xl font-bold text-slate-800">Profil</h1>

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">Kişisel Bilgiler</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Kişisel bilgilerinizi güncelleyin
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    <span>Ad Soyad</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Adınızı ve soyadınızı girin"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    <span>E-posta Adresi</span>
                                    <span className="text-xs text-slate-400">(Salt Okunur)</span>
                                </div>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                readOnly
                                disabled
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                                placeholder="ornek@email.com"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>Telefon Numarası</span>
                                </div>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="(0532) 123 45 67"
                                maxLength={17}
                            />
                        </div>

                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-slate-400" />
                                    <span>Şirket Adı</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => handleInputChange('company_name', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Şirket adını girin"
                            />
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-slate-400" />
                                    <span>Sektör</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => handleInputChange('industry', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Sektörü girin"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} className="text-slate-400" />
                                    <span>Pozisyon / Rol</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Pozisyonunuzu girin"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
