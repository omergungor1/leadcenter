'use client';

import { useState } from 'react';
import { X, Users, User, Megaphone, CheckSquare } from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';

export default function CreateModal({ onClose }) {
    const [selectedType, setSelectedType] = useState(null);

    const createOptions = [
        { icon: Users, label: 'Create Lead Group', type: 'lead-group' },
        { icon: User, label: 'Create Lead', type: 'lead' },
        { icon: Megaphone, label: 'Create Campaign', type: 'campaign' },
        { icon: CheckSquare, label: 'Create Task', type: 'task' },
    ];

    if (selectedType) {
        return <CreateFormModal type={selectedType} onClose={onClose} onBack={() => setSelectedType(null)} />;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Create New</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-2">
                    {createOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.type}
                                onClick={() => setSelectedType(option.type)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                            >
                                <Icon size={20} className="text-slate-600" />
                                <span className="text-slate-800 font-medium">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function CreateFormModal({ type, onClose, onBack }) {
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        district: '',
        keywords: '',
        description: '',
        type: '',
        leadGroups: [],
        messageTemplate: '',
        relatedLead: '',
        dueDate: '',
        taskType: '',
        phone: '',
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock: Just close modal for now
        alert(`${type} created successfully! (Mock)`);
        onClose();
    };

    const renderForm = () => {
        switch (type) {
            case 'lead-group':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., İstanbul Kuaför Listesi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">District</label>
                            <input
                                type="text"
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Keywords (comma separated)</label>
                            <input
                                type="text"
                                value={formData.keywords}
                                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="kuaför, saç, güzellik"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            />
                        </div>
                    </>
                );
            case 'lead':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                            <input
                                type="text"
                                value={formData.phone || ''}
                                onChange={(e) => {
                                    const formatted = formatPhoneNumber(e.target.value);
                                    setFormData({ ...formData, phone: formatted });
                                }}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="(0543) 545 56 42"
                                maxLength={17}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="info@example.com"
                            />
                        </div>
                    </>
                );
            case 'campaign':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select type</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Email">Email</option>
                                <option value="Call">Call</option>
                                <option value="Visit">Visit</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Message Template</label>
                            <textarea
                                value={formData.messageTemplate}
                                onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="4"
                                placeholder="Use {{company_name}}, {{city}}, {{district}} as merge tags"
                            />
                        </div>
                    </>
                );
            case 'task':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Task Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Related Lead</label>
                            <input
                                type="text"
                                value={formData.relatedLead}
                                onChange={(e) => setFormData({ ...formData, relatedLead: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                            <input
                                type="datetime-local"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                            <select
                                value={formData.taskType}
                                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select type</option>
                                <option value="Call">Call</option>
                                <option value="Email">Email</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Visit">Visit</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                ←
                            </button>
                        )}
                        <h2 className="text-xl font-semibold text-slate-800">
                            Create {type === 'lead-group' ? 'Lead Group' : type === 'lead' ? 'Lead' : type === 'campaign' ? 'Campaign' : 'Task'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {renderForm()}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

