'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft, ChevronDown, FileText, Contact, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchById, fetchAll } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LeadGroupDetail({ id }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('leads');
    const [group, setGroup] = useState(null);
    const [groupLeads, setGroupLeads] = useState([]);
    const [groupActivities, setGroupActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user ID
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

    // Fetch group data and leads
    useEffect(() => {
        const fetchGroupData = async () => {
            if (!id || !userId) return;

            setIsLoading(true);
            try {
                // Fetch group
                const { data: groupData, error: groupError } = await fetchById('lead_groups', id);
                if (groupError || !groupData) {
                    toast.error('Lead group not found');
                    return;
                }
                setGroup(groupData);

                // Fetch leads from lead_groups_map
                const { data: groupMapData, error: groupMapError } = await fetchAll('lead_groups_map', '*', {
                    lead_group_id: id,
                });

                if (groupMapError) {
                    console.error('Error fetching lead groups map:', groupMapError);
                }

                // Also fetch leads with primary_group_id
                const { data: primaryLeadsData, error: primaryLeadsError } = await fetchAll('leads', '*', {
                    primary_group_id: id,
                    user_id: userId,
                    is_active: true,
                });

                if (primaryLeadsError) {
                    console.error('Error fetching primary leads:', primaryLeadsError);
                }

                // Combine lead IDs from both sources
                const allLeadIds = [];

                if (groupMapData && groupMapData.length > 0) {
                    const mapLeadIds = groupMapData.map((gm) => gm.lead_id);
                    allLeadIds.push(...mapLeadIds);
                }

                if (primaryLeadsData && primaryLeadsData.length > 0) {
                    const primaryLeadIds = primaryLeadsData.map((lead) => lead.id);
                    allLeadIds.push(...primaryLeadIds);
                }

                // Fetch all unique leads
                if (allLeadIds.length > 0) {
                    const uniqueLeadIds = [...new Set(allLeadIds)];
                    const { data: leadsData, error: leadsError } = await fetchAll('leads', '*', {
                        id: uniqueLeadIds,
                        user_id: userId,
                        is_active: true,
                    });

                    if (leadsError) {
                        console.error('Error fetching leads:', leadsError);
                    } else {
                        setGroupLeads(leadsData || []);
                    }
                } else {
                    setGroupLeads([]);
                }

                // Fetch activities for all leads in the group
                if (allLeadIds.length > 0) {
                    const uniqueLeadIds = [...new Set(allLeadIds)];
                    const { data: activitiesData, error: activitiesError } = await fetchAll('activities', '*', {
                        lead_id: uniqueLeadIds,
                        user_id: userId,
                    });

                    if (activitiesError) {
                        console.error('Error fetching activities:', activitiesError);
                    } else {
                        // Sort activities by created_at descending
                        const sorted = (activitiesData || []).sort(
                            (a, b) => new Date(b.created_at) - new Date(a.created_at)
                        );
                        setGroupActivities(sorted);
                    }
                } else {
                    setGroupActivities([]);
                }
            } catch (error) {
                toast.error('Veri yüklenirken bir hata oluştu. Hata kodu: ' + error.code);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroupData();
    }, [id, userId]);

    if (isLoading) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Lead group not found</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'processing':
                return 'bg-blue-100 text-blue-700';
            case 'pending':
                return 'bg-orange-100 text-orange-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const handleExportCSV = () => {
        // Mock: Export to CSV
        toast.success('Müşteri grubu CSV olarak dışa aktarılıyor... (Mock)');
    };

    const handleExportVCF = () => {
        // Mock: Export to VCF
        toast.success('Müşteri grubu VCF olarak dışa aktarılıyor... (Mock)');
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
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-800">{group.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
                                group.status
                            )}`}
                        >
                            {group.status ? group.status.charAt(0).toUpperCase() + group.status.slice(1) : 'Pending'}
                        </span>
                        <span className="text-slate-600">{groupLeads.length} leads</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="default" className="focus-visible:outline-none focus-visible:ring-0">
                        <Plus size={18} />
                        <span>Müşteri Ekle</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="default" className="focus-visible:outline-none focus-visible:ring-0">
                                <Download size={18} />
                                <span>İndir</span>
                                <ChevronDown size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white">
                            <DropdownMenuItem
                                onClick={handleExportCSV}
                                className="cursor-pointer"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <span>İndir (.csv)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleExportVCF}
                                className="cursor-pointer"
                            >
                                <Contact className="mr-2 h-4 w-4" />
                                <span>İndir (.vcf)</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {['müşteriler', 'notlar', 'geçmiş'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                {activeTab === 'leads' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Firma Adı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Kategori
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Telefon
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        E-posta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {groupLeads.length > 0 ? (
                                    groupLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/leads/${lead.id}`}
                                                    className="font-medium text-slate-800 hover:text-blue-600"
                                                >
                                                    {lead.company || lead.name || 'N/A'}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{lead.business_type || '-'}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {lead.phone ? formatPhoneNumber(lead.phone) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{lead.email || '-'}</td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/leads/${lead.id}`}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Görüntüle
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            Bu grupta müşteri yok
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-slate-800 font-medium mb-1">Grup Notları</p>
                                <p className="text-slate-600 text-sm">{group.order_note || 'No notes available'}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Oluşturulma Tarihi: {formatDate(group.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="p-6">
                        <div className="space-y-4">
                            {groupActivities.length > 0 ? (
                                groupActivities.map((activity) => (
                                    <div key={activity.id} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-slate-800">
                                                {activity.activity_type ? activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1) : 'Activity'}
                                            </p>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(activity.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{activity.content || 'İçerik yok'}</p>
                                        {activity.status && (
                                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${activity.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : activity.status === 'pending'
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">Geçmiş kaydı yok</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

