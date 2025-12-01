'use client';

import { useState } from 'react';
import { MessageSquare, Phone, Mail, MapPin, Save } from 'lucide-react';

export default function SettingsPage() {
    const [dailyLimits, setDailyLimits] = useState({
        whatsapp: 100,
        call: 50,
        email: 200,
        visit: 20,
    });

    const [isSaving, setIsSaving] = useState(false);

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
        </div>
    );
}
