'use client';

import { useState } from 'react';
import { X, Package, FolderPlus } from 'lucide-react';
import { insert } from '@/lib/supabase/database';
import { toast } from 'sonner';

export default function CreateLeadGroupModal({ userId, onClose, onSuccess }) {
    const [groupType, setGroupType] = useState(null); // 'order' or 'custom'
    const [formData, setFormData] = useState({
        name: '',
        keyword: '',
        order_note: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Group name is required');
            return;
        }

        if (groupType === 'order') {
            if (!formData.keyword.trim()) {
                toast.error('Keyword is required for Lead Order');
                return;
            }
            if (!formData.order_note.trim()) {
                toast.error('Order note is required for Lead Order');
                return;
            }
        }

        setIsSaving(true);
        try {
            const groupData = {
                user_id: userId,
                name: formData.name,
                is_order: groupType === 'order',
                status: groupType === 'order' ? 'pending' : 'completed',
                lead_count: 0,
                is_active: true,
            };

            if (groupType === 'order') {
                // Combine keyword and order_note
                const fullOrderNote = `Keyword: ${formData.keyword}\n\n${formData.order_note}`;
                groupData.order_note = fullOrderNote;
                groupData.ordered_at = new Date().toISOString();
            }

            const { data, error } = await insert('lead_groups', groupData);

            if (error) {
                toast.error('Error creating lead group: ' + error.message);
                return;
            }

            toast.success(
                groupType === 'order'
                    ? 'Lead order created successfully!'
                    : 'Custom group created successfully!'
            );
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setGroupType(null);
        setFormData({
            name: '',
            keyword: '',
            order_note: '',
        });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">Create Lead Group</h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!groupType ? (
                    // Group Type Selection
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 mb-4">
                            Choose the type of lead group you want to create:
                        </p>

                        <button
                            onClick={() => setGroupType('order')}
                            className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Package size={24} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 mb-1">Lead Order</h4>
                                    <p className="text-sm text-slate-600">
                                        Create a data order request. Specify which businesses you want to collect from which cities/districts.
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setGroupType('custom')}
                            className="w-full p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <FolderPlus size={24} className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 mb-1">Custom Group</h4>
                                    <p className="text-sm text-slate-600">
                                        Create an empty lead group that you can manually add leads to.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    // Form
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Lead Group Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., İstanbul Kuaförler"
                                required
                            />
                        </div>

                        {groupType === 'order' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Keyword <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.keyword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, keyword: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., kuaför, berber, eczane"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Order Note <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.order_note}
                                        onChange={(e) =>
                                            setFormData({ ...formData, order_note: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="4"
                                        placeholder="Hangi il ilçelerdeki hangi işletmeleri toplamak istiyorsunuz detaylı belirtiniz. Örneğin: İstanbul Kuaförler, İstanbul Başakşehir Berberler, Türkiye Eczane Listesi"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setGroupType(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

