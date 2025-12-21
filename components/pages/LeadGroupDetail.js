'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft, Plus, X, Search, Loader2, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';
import { Button } from '../ui/button';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchById, fetchAll } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ExportLeadGroupModal from '../modals/ExportLeadGroupModal';

export default function LeadGroupDetail({ id }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('müşteriler');
    const [group, setGroup] = useState(null);
    const [groupLeads, setGroupLeads] = useState([]);
    const [groupActivities, setGroupActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [exportingGroup, setExportingGroup] = useState(null);
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [isAddingLeads, setIsAddingLeads] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState(null);

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
                    toast.error('Müşteri grubu bulunamadı');
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

    // Search leads with debounce
    useEffect(() => {
        const searchLeads = async (query) => {
            if (!query.trim() || !userId) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from('leads')
                    .select('id, company, name, city, district, phone, business_type')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .or(
                        `company.ilike.%${query}%,name.ilike.%${query}%,city.ilike.%${query}%,district.ilike.%${query}%,business_type.ilike.%${query}%`
                    )
                    .limit(10);

                if (error) {
                    console.error('Error searching leads:', error);
                    return;
                }

                setSearchResults(data || []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(() => {
            searchLeads(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, userId]);

    const addLead = (lead) => {
        // Check if lead already added
        if (selectedLeads.some((l) => l.id === lead.id)) {
            toast.info('Müşteri zaten seçildi');
            return;
        }

        setSelectedLeads([...selectedLeads, lead]);

        // Clear search
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeLead = (leadId) => {
        setSelectedLeads(selectedLeads.filter((l) => l.id !== leadId));
    };

    const handleAddLeadsToGroup = async () => {
        if (selectedLeads.length === 0) {
            toast.error('Lütfen en az bir müşteri seçin');
            return;
        }

        setIsAddingLeads(true);
        try {
            // Get existing lead IDs in the group to avoid duplicates
            const existingLeadIds = new Set();

            // From lead_groups_map
            const { data: groupMapData } = await fetchAll('lead_groups_map', '*', {
                lead_group_id: id,
            });
            if (groupMapData) {
                groupMapData.forEach((gm) => existingLeadIds.add(gm.lead_id));
            }

            // From primary_group_id
            const { data: primaryLeadsData } = await fetchAll('leads', '*', {
                primary_group_id: id,
                user_id: userId,
                is_active: true,
            });
            if (primaryLeadsData) {
                primaryLeadsData.forEach((lead) => existingLeadIds.add(lead.id));
            }

            // Filter out already added leads
            const leadsToAdd = selectedLeads.filter((lead) => !existingLeadIds.has(lead.id));

            if (leadsToAdd.length === 0) {
                toast.info('Seçilen müşteriler zaten grupta');
                setIsAddingLeads(false);
                return;
            }

            // Insert into lead_groups_map
            const mapEntries = leadsToAdd.map((lead) => ({
                user_id: userId,
                lead_id: lead.id,
                lead_group_id: id,
            }));

            const { error: mapError } = await supabase
                .from('lead_groups_map')
                .insert(mapEntries);

            if (mapError) {
                toast.error('Müşteriler eklenirken hata oluştu: ' + mapError.message);
                return;
            }

            // Update lead_count
            const { data: groupData, error: groupError } = await fetchById('lead_groups', id);
            if (!groupError && groupData) {
                const newLeadCount = (groupData.lead_count || 0) + leadsToAdd.length;
                const { error: updateError } = await supabase
                    .from('lead_groups')
                    .update({
                        lead_count: newLeadCount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);

                if (updateError) {
                    console.error('Error updating lead_count:', updateError);
                }
            }

            toast.success(`${leadsToAdd.length} müşteri başarıyla eklendi!`);

            // Refresh group data and leads
            if (id && userId) {
                // Refresh group
                fetchById('lead_groups', id).then(({ data, error }) => {
                    if (!error && data) {
                        setGroup(data);
                    }
                });

                // Refresh leads
                const fetchGroupData = async () => {
                    // Fetch leads from lead_groups_map
                    const { data: groupMapData } = await fetchAll('lead_groups_map', '*', {
                        lead_group_id: id,
                    });

                    // Also fetch leads with primary_group_id
                    const { data: primaryLeadsData } = await fetchAll('leads', '*', {
                        primary_group_id: id,
                        user_id: userId,
                        is_active: true,
                    });

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
                        const { data: leadsData } = await fetchAll('leads', '*', {
                            id: uniqueLeadIds,
                            user_id: userId,
                            is_active: true,
                        });

                        if (leadsData) {
                            setGroupLeads(leadsData || []);
                        }
                    } else {
                        setGroupLeads([]);
                    }
                };

                fetchGroupData();
            }

            // Close modal and reset
            setShowAddLeadModal(false);
            setSelectedLeads([]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsAddingLeads(false);
        }
    };

    const handleDeleteLead = async (leadId) => {
        if (!leadId || !id || !userId) return;

        try {
            // Find the lead_groups_map entry (only manually added leads can be deleted)
            const { data: mapData, error: mapFindError } = await fetchAll('lead_groups_map', '*', {
                lead_group_id: id,
                lead_id: leadId,
            });

            if (mapFindError) {
                toast.error('Müşteri grubu ilişkisi kontrol edilirken hata oluştu');
                return;
            }

            if (!mapData || mapData.length === 0) {
                toast.error('Bu müşteri manuel olarak eklenmemiş, kaldırılamaz');
                return;
            }

            // Delete from lead_groups_map
            const { error: deleteError } = await supabase
                .from('lead_groups_map')
                .delete()
                .eq('id', mapData[0].id);

            if (deleteError) {
                toast.error('Müşteri silinirken hata oluştu: ' + deleteError.message);
                return;
            }

            // Update lead_count
            const { data: groupData, error: groupError } = await fetchById('lead_groups', id);
            if (!groupError && groupData) {
                const newLeadCount = Math.max(0, (groupData.lead_count || 0) - 1);
                const { error: updateError } = await supabase
                    .from('lead_groups')
                    .update({
                        lead_count: newLeadCount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);

                if (updateError) {
                    console.error('Error updating lead_count:', updateError);
                }
            }

            toast.success('Müşteri gruptan kaldırıldı');

            // Refresh group data and leads
            if (id && userId) {
                // Refresh group
                fetchById('lead_groups', id).then(({ data, error }) => {
                    if (!error && data) {
                        setGroup(data);
                    }
                });

                // Refresh leads
                const fetchGroupData = async () => {
                    // Fetch leads from lead_groups_map
                    const { data: groupMapData } = await fetchAll('lead_groups_map', '*', {
                        lead_group_id: id,
                    });

                    // Also fetch leads with primary_group_id
                    const { data: primaryLeadsData } = await fetchAll('leads', '*', {
                        primary_group_id: id,
                        user_id: userId,
                        is_active: true,
                    });

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
                        const { data: leadsData } = await fetchAll('leads', '*', {
                            id: uniqueLeadIds,
                            user_id: userId,
                            is_active: true,
                        });

                        if (leadsData) {
                            setGroupLeads(leadsData || []);
                        }
                    } else {
                        setGroupLeads([]);
                    }
                };

                fetchGroupData();
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLeadToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Yükleniyor...</p>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Müşteri grubu bulunamadı</p>
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

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'Tamamlandı';
            case 'processing':
                return 'İşleniyor';
            case 'pending':
                return 'Beklemede';
            case 'cancelled':
                return 'İptal Edildi';
            default:
                return status || '-';
        }
    };

    const getActivityTypeLabel = (type) => {
        switch (type?.toLowerCase()) {
            case 'note':
                return 'Not';
            case 'email':
                return 'E-posta';
            case 'call':
                return 'Arama';
            case 'whatsapp':
                return 'WhatsApp';
            case 'follow_up':
                return 'Takip';
            case 'visit':
                return 'Ziyaret';
            case 'meeting':
                return 'Toplantı';
            case 'todo':
                return 'Görev';
            default:
                return type || 'Aktivite';
        }
    };

    const getActivityStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'Tamamlandı';
            case 'pending':
                return 'Beklemede';
            case 'cancelled':
                return 'İptal';
            default:
                return status || '-';
        }
    };

    const handleExport = (format) => {
        if (group) {
            setExportingGroup(group);
        }
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
                            {getStatusLabel(group.status)}
                        </span>
                        <span className="text-slate-600">{groupLeads.length} müşteri</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!group.is_order && (
                        <Button
                            variant="outline"
                            size="default"
                            className="focus-visible:outline-none focus-visible:ring-0"
                            onClick={() => setShowAddLeadModal(true)}
                        >
                            <Plus size={18} />
                            <span>Müşteri Ekle</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="default"
                        className="focus-visible:outline-none focus-visible:ring-0"
                        onClick={() => handleExport()}
                    >
                        <Download size={18} />
                        <span>İndir</span>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {['müşteriler', 'notlar', 'geçmiş'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
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
                {activeTab === 'müşteriler' && (
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
                                                    {lead.company || lead.name || '-'}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{lead.business_type || '-'}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {lead.phone ? formatPhoneNumber(lead.phone) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{lead.email || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/leads/${lead.id}`}
                                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Görüntüle"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    {!group.is_order && (
                                                        <button
                                                            onClick={() => setLeadToDelete(lead)}
                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Gruptan Kaldır"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
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

                {activeTab === 'notlar' && (
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-slate-800 font-medium mb-1">Grup Notları</p>
                                <p className="text-slate-600 text-sm">{group.order_note || 'Not yok'}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Oluşturulma Tarihi: {formatDate(group.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'geçmiş' && (
                    <div className="p-6">
                        <div className="space-y-4">
                            {groupActivities.length > 0 ? (
                                groupActivities.map((activity) => (
                                    <div key={activity.id} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-slate-800">
                                                {getActivityTypeLabel(activity.activity_type)}
                                            </p>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(activity.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{activity.content || 'İçerik yok'}</p>
                                        {activity.status && (
                                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${activity.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : activity.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-700'
                                                    : activity.status === 'pending'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {getActivityStatusLabel(activity.status)}
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

            {/* Add Leads Modal */}
            {showAddLeadModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => {
                        setShowAddLeadModal(false);
                        setSelectedLeads([]);
                        setSearchQuery('');
                        setSearchResults([]);
                    }}
                >
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-slate-800">Müşteri Ekle</h3>
                            <button
                                onClick={() => {
                                    setShowAddLeadModal(false);
                                    setSelectedLeads([]);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Search */}
                            <div className="border border-slate-200 rounded-xl p-4 relative">
                                <h3 className="text-sm font-medium text-slate-700 mb-3">Müşteri Ara</h3>
                                <div className="relative mb-3">
                                    <Search
                                        size={18}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Şirket, şehir, ilçe gibi bilgilerle ara..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Search Results Dropdown */}
                                {searchQuery && (
                                    <div className="absolute left-4 right-4 top-[90px] mt-1 max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg z-50">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-slate-500">
                                                <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                                                <span className="text-sm">Aranıyor...</span>
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="divide-y divide-slate-200">
                                                {searchResults.map((lead) => (
                                                    <div
                                                        key={lead.id}
                                                        className="p-3 hover:bg-slate-50 flex items-center justify-between"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-800 text-sm">
                                                                {lead.company || lead.name || 'Bilinmeyen'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {lead.business_type ? lead.business_type + ' - ' : ''}
                                                                {lead.city || '-'}
                                                                {lead.district ? ` / ${lead.district}` : ''}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => addLead(lead)}
                                                            disabled={selectedLeads.some((l) => l.id === lead.id)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1"
                                                        >
                                                            <Plus size={14} />
                                                            Ekle
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-slate-500 text-sm">
                                                Müşteri bulunamadı
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Leads List */}
                                {selectedLeads.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedLeads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                                            >
                                                <span className="text-sm font-medium text-slate-800">
                                                    {lead.company || lead.name || 'Bilinmeyen'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLead(lead.id)}
                                                    className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                                                    title="Kaldır"
                                                >
                                                    <X size={14} className="text-slate-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddLeadModal(false);
                                        setSelectedLeads([]);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddLeadsToGroup}
                                    disabled={isAddingLeads || selectedLeads.length === 0}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAddingLeads ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Ekleniyor...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            <span>Ekle ({selectedLeads.length})</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Lead Confirmation Modal */}
            {leadToDelete && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setLeadToDelete(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Müşteriyi Gruptan Kaldır</h3>
                        <p className="text-slate-600 mb-6">
                            <span className="font-medium">{leadToDelete.company || leadToDelete.name || 'Bu müşteri'}</span> grubundan kaldırılsın mı? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLeadToDelete(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleDeleteLead(leadToDelete.id)}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                            >
                                Kaldır
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Lead Group Modal */}
            {exportingGroup && (
                <ExportLeadGroupModal
                    group={exportingGroup}
                    onClose={() => {
                        setExportingGroup(null);
                        // Refresh group data to get updated export status
                        if (id && userId) {
                            fetchById('lead_groups', id).then(({ data, error }) => {
                                if (!error && data) {
                                    setGroup(data);
                                }
                            });
                        }
                    }}
                />
            )}

        </div>
    );
}

