'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { insert } from '@/lib/supabase/database';
import { toast } from 'sonner';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

export default function CreateLeadModal({ userId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        business_type: '',
        address: '',
        city: '',
        district: '',
        phone: '',
        website: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('İlgili Kişi Adı gereklidir');
            return;
        }

        setIsSaving(true);
        try {
            const leadData = {
                user_id: userId,
                name: formData.name.trim(),
                company: formData.company.trim() || null,
                business_type: formData.business_type.trim() || null,
                address: formData.address.trim() || null,
                city: formData.city.trim() || null,
                district: formData.district.trim() || null,
                phone: formData.phone.trim() || null,
                website: formData.website.trim() || null,
                is_active: true,
            };

            const { data, error } = await insert('leads', leadData);

            if (error) {
                toast.error('Müşteri oluşturulurken hata oluştu: ' + error.message);
                return;
            }

            toast.success('Müşteri başarıyla oluşturuldu!');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            company: '',
            business_type: '',
            address: '',
            city: '',
            district: '',
            phone: '',
            website: '',
        });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">Yeni Müşteri Ekle</h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            İlgili Kişi Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Örneğin: Ahmet Yılmaz"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Firma Adı
                            </label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örneğin: ABC Şirketi"
                                maxLength={100}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Sektör
                            </label>
                            <input
                                type="text"
                                value={formData.business_type}
                                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örneğin: Kuaför, Berber"
                                maxLength={100}
                            />
                        </div>

                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Adres
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Örneğin: Atatürk Caddesi No:123"
                            maxLength={200}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Şehir
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örneğin: İstanbul"
                                maxLength={50}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                İlçe
                            </label>
                            <input
                                type="text"
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örneğin: Kadıköy"
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Telefon
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => {
                                    const formatted = formatPhoneNumber(e.target.value);
                                    setFormData({ ...formData, phone: formatted });
                                }}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örneğin: (0212) 123 45 67"
                                maxLength={20}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Website
                            </label>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örneğin: https://www.example.com"
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
