'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import leadGroupsData from '../../data/leadGroups.json';
import leadsData from '../../data/leads.json';
import { Button } from '../ui/button';

export default function CreateCampaign() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const groupIdFromQuery = searchParams.get('groupId');

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        selectedLeadGroups: [],
        selectedLeads: [],
        message: '',
        emailTitle: '',
        emailContent: '',
        note: '',
    });

    const [leadSelectionMode, setLeadSelectionMode] = useState('groups'); // 'groups' or 'individual'
    const [isFormValid, setIsFormValid] = useState(false);

    // Pre-select group if coming from lead group detail page
    useEffect(() => {
        if (groupIdFromQuery) {
            setFormData(prev => ({
                ...prev,
                selectedLeadGroups: [groupIdFromQuery],
            }));
        }
    }, [groupIdFromQuery]);

    // Validate form
    useEffect(() => {
        const hasName = formData.name.trim() !== '';
        const hasType = formData.type !== '';
        const hasLeads = formData.selectedLeadGroups.length > 0 || formData.selectedLeads.length > 0;

        let hasContent = false;
        if (formData.type === 'WhatsApp') {
            hasContent = formData.message.trim() !== '';
        } else if (formData.type === 'Email') {
            hasContent = formData.emailTitle.trim() !== '' && formData.emailContent.trim() !== '';
        } else if (formData.type === 'Call' || formData.type === 'Visit') {
            hasContent = formData.note.trim() !== '';
        }

        setIsFormValid(hasName && hasType && hasLeads && hasContent);
    }, [formData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        // Mock: Save campaign
        alert('Campaign created successfully! (Mock)');
        router.push('/campaigns');
    };

    const toggleLeadGroup = (groupId) => {
        setFormData(prev => ({
            ...prev,
            selectedLeadGroups: prev.selectedLeadGroups.includes(groupId)
                ? prev.selectedLeadGroups.filter(id => id !== groupId)
                : [...prev.selectedLeadGroups, groupId],
        }));
    };

    const toggleLead = (leadId) => {
        setFormData(prev => ({
            ...prev,
            selectedLeads: prev.selectedLeads.includes(leadId)
                ? prev.selectedLeads.filter(id => id !== leadId)
                : [...prev.selectedLeads, leadId],
        }));
    };

    const getSelectedLeadsCount = () => {
        let count = 0;
        if (leadSelectionMode === 'groups') {
            formData.selectedLeadGroups.forEach(groupId => {
                const group = leadGroupsData.find(g => g.id === groupId);
                if (group) count += group.leadCount;
            });
        } else {
            count = formData.selectedLeads.length;
        }
        return count;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-bold text-slate-800">Create Campaign</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
                    {/* Campaign Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Campaign Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., WhatsApp Campaign - Kuaförler"
                            required
                        />
                    </div>

                    {/* Campaign Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Campaign Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value, message: '', emailTitle: '', emailContent: '', note: '' })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select campaign type</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Email">Email</option>
                            <option value="Call">Call</option>
                            <option value="Visit">Visit</option>
                        </select>
                    </div>

                    {/* Lead Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Lead Selection <span className="text-red-500">*</span>
                        </label>

                        {/* Selection Mode Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setLeadSelectionMode('groups')}
                                className={`px-4 py-2 rounded-xl transition-colors ${leadSelectionMode === 'groups'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                By Groups
                            </button>
                            <button
                                type="button"
                                onClick={() => setLeadSelectionMode('individual')}
                                className={`px-4 py-2 rounded-xl transition-colors ${leadSelectionMode === 'individual'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                Individual Leads
                            </button>
                        </div>

                        {/* Selected Count */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                            <p className="text-sm text-slate-700">
                                <span className="font-medium">{getSelectedLeadsCount()}</span> leads selected
                            </p>
                        </div>

                        {/* Lead Groups Selection */}
                        {leadSelectionMode === 'groups' && (
                            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-4 space-y-2">
                                {leadGroupsData.map((group) => (
                                    <label
                                        key={group.id}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedLeadGroups.includes(group.id)}
                                            onChange={() => toggleLeadGroup(group.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800">{group.name}</p>
                                            <p className="text-sm text-slate-500">{group.leadCount} leads</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Individual Leads Selection */}
                        {leadSelectionMode === 'individual' && (
                            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-4 space-y-2">
                                {leadsData.map((lead) => (
                                    <label
                                        key={lead.id}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedLeads.includes(lead.id)}
                                            onChange={() => toggleLead(lead.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800">{lead.companyName}</p>
                                            <p className="text-sm text-slate-500">{lead.email} • {lead.phone}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* WhatsApp Message */}
                    {formData.type === 'WhatsApp' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="6"
                                placeholder="Enter your WhatsApp message. Use {{company_name}}, {{city}}, {{district}} as merge tags."
                                required
                            />
                        </div>
                    )}

                    {/* Email Title & Content */}
                    {formData.type === 'Email' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.emailTitle}
                                    onChange={(e) => setFormData({ ...formData, emailTitle: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Email subject"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.emailContent}
                                    onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="8"
                                    placeholder="Enter your email content. Use {{company_name}}, {{city}}, {{district}} as merge tags."
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Call/Visit Note */}
                    {(formData.type === 'Call' || formData.type === 'Visit') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Note <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="6"
                                placeholder={`Enter notes for ${formData.type.toLowerCase()} campaign`}
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/campaigns">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={!isFormValid}
                        className="flex items-center gap-2"
                    >
                        <Save size={18} />
                        <span>Save Campaign</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}

