'use client';

import { useState } from 'react';
import { MessageSquare, Phone, Mail, MapPin, Save, Plus, Edit2, Trash2, X } from 'lucide-react';
import tagsData from '../../data/tags.json';
import { formatDate } from '../../utils/formatDate';

export default function SettingsPage() {
    const [dailyLimits, setDailyLimits] = useState({
        whatsapp: 100,
        call: 50,
        email: 200,
        visit: 20,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [tags, setTags] = useState(tagsData);
    const [showTagModal, setShowTagModal] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [tagForm, setTagForm] = useState({
        name: '',
        color: '#3B82F6',
    });

    const handleLimitChange = (type, value) => {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0) {
            setDailyLimits({
                ...dailyLimits,
                [type]: numValue,
            });
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        // Mock: Simulate API call
        setTimeout(() => {
            alert('Daily limits updated successfully! (Mock)');
            setIsSaving(false);
        }, 500);
    };

    const limitItems = [
        {
            key: 'whatsapp',
            label: 'WhatsApp',
            icon: MessageSquare,
            color: 'green',
            description: 'Daily WhatsApp message limit',
        },
        {
            key: 'call',
            label: 'Call',
            icon: Phone,
            color: 'blue',
            description: 'Daily call limit',
        },
        {
            key: 'email',
            label: 'Email',
            icon: Mail,
            color: 'purple',
            description: 'Daily email limit',
        },
        {
            key: 'visit',
            label: 'Visit',
            icon: MapPin,
            color: 'orange',
            description: 'Daily visit limit',
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
                color: tag.color,
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

    const handleSaveTag = () => {
        if (!tagForm.name.trim()) {
            alert('Tag name is required');
            return;
        }

        if (editingTag) {
            // Update existing tag
            setTags(tags.map((tag) =>
                tag.id === editingTag.id
                    ? { ...tag, name: tagForm.name, color: tagForm.color }
                    : tag
            ));
            alert('Tag updated successfully! (Mock)');
        } else {
            // Create new tag
            const newTag = {
                id: String(Date.now()),
                name: tagForm.name,
                color: tagForm.color,
                createdDate: new Date().toISOString(),
            };
            setTags([...tags, newTag]);
            alert('Tag created successfully! (Mock)');
        }
        handleCloseTagModal();
    };

    const handleDeleteTag = (tagId) => {
        if (confirm('Are you sure you want to delete this tag?')) {
            setTags(tags.filter((tag) => tag.id !== tagId));
            alert('Tag deleted successfully! (Mock)');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Settings</h1>

            {/* Daily Limits Panel */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Daily Limits & Goals</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Set daily limits for each campaign type
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
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
                                        Daily Limit
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
                                        <span className="text-slate-500 font-medium">/ day</span>
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
                        <h2 className="text-xl font-semibold text-slate-800">Tag Management</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Create, edit, and delete tags for leads
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenTagModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        <span>Add Tag</span>
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
                                        style={{ backgroundColor: tag.color }}
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-800">{tag.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {formatDate(tag.createdDate)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenTagModal(tag)}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Edit tag"
                                    >
                                        <Edit2 size={16} className="text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTag(tag.id)}
                                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete tag"
                                    >
                                        <Trash2 size={16} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-3 py-1 rounded-lg text-xs font-medium"
                                    style={{
                                        backgroundColor: `${tag.color}20`,
                                        color: tag.color,
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
                                {editingTag ? 'Edit Tag' : 'Create Tag'}
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
                                    Tag Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={tagForm.name}
                                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Premium, VIP"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Color <span className="text-red-500">*</span>
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
                                        Preview
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseTagModal}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTag}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                            >
                                {editingTag ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
