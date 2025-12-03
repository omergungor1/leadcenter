'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ChevronLeft,
    MapPin,
    Phone,
    Mail,
    Globe,
    Map,
    Edit,
    FileText,
    PhoneCall,
    Mail as MailIcon,
    MessageSquare,
    CheckSquare,
    Calendar,
    Plus,
    Clock,
    X,
    Star,
    Heart,
    Hourglass,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone } from 'lucide-react';
import { formatDate, formatDateTime, formatTime, formatTimeAgo } from '../../utils/formatDate';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber';
import { toast } from 'sonner';
import { useAuth } from '@/lib/supabase/hooks';
import { fetchById, fetchAll, updateById, insert, deleteById } from '@/lib/supabase/database';
import { supabase } from '@/lib/supabase/client';
import { useEffect } from 'react';
import QuickActionPanel from '../modals/QuickActionPanel';

export default function LeadDetail({ id }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [userId, setUserId] = useState(null);
    // Removed activeTab state - only timeline view now
    const [lead, setLead] = useState(null);
    const [leadActivities, setLeadActivities] = useState([]);
    const [leadTasks, setLeadTasks] = useState([]);
    const [leadGroups, setLeadGroups] = useState([]);
    const [leadCampaigns, setLeadCampaigns] = useState([]);
    const [leadTags, setLeadTags] = useState([]);
    const [allUserTags, setAllUserTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showAllWorkingHours, setShowAllWorkingHours] = useState(false);
    const [showQuickActionPanel, setShowQuickActionPanel] = useState(false);
    const [selectedActionType, setSelectedActionType] = useState(null);
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    // Get today's day name in Turkish
    const getTodayInTurkish = () => {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const today = new Date().getDay();
        return days[today];
    };

    const todayInTurkish = getTodayInTurkish();

    // Toggle favorite
    const handleToggleFavorite = async () => {
        if (!lead || !userId) return;

        try {
            const newFavoriteStatus = !lead.is_favorite;
            const { error } = await updateById('leads', lead.id, {
                is_favorite: newFavoriteStatus,
            });

            if (error) {
                toast.error('Error updating favorite: ' + error.message);
                return;
            }

            // Update local state
            setLead({ ...lead, is_favorite: newFavoriteStatus });
            toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

    // Add tag to lead
    const handleAddTag = async (tagId) => {
        if (!lead || !userId) return;

        try {
            // Check if tag already exists
            const existingTag = leadTags.find((t) => t.id === tagId);
            if (existingTag) {
                toast.info('Tag already added');
                return;
            }

            // Insert into lead_tag_map
            const { error } = await insert('lead_tag_map', {
                user_id: userId,
                lead_id: lead.id,
                tag_id: tagId,
            });

            if (error) {
                toast.error('Error adding tag: ' + error.message);
                return;
            }

            // Find the tag and add to state
            const tagToAdd = allUserTags.find((t) => t.id === tagId);
            if (tagToAdd) {
                setLeadTags([...leadTags, tagToAdd]);
                toast.success('Tag added');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

    // Remove tag from lead
    const handleRemoveTag = async (tagId) => {
        if (!lead || !userId) return;

        try {
            // Find the tag map entry
            const { data: tagMapData } = await fetchAll('lead_tag_map', '*', {
                lead_id: lead.id,
                tag_id: tagId,
            });

            if (tagMapData && tagMapData.length > 0) {
                // Delete the tag map entry
                const { error } = await deleteById('lead_tag_map', tagMapData[0].id);

                if (error) {
                    toast.error('Error removing tag: ' + error.message);
                    return;
                }

                // Remove from state
                setLeadTags(leadTags.filter((t) => t.id !== tagId));
                toast.success('Tag removed');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred');
        }
    };

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

    // Fetch lead data
    useEffect(() => {
        const fetchLeadData = async () => {
            if (!id || !userId) return;

            setIsLoading(true);
            try {
                // Fetch lead
                const { data: leadData, error: leadError } = await fetchById('leads', id);
                if (leadError || !leadData) {
                    return;
                }
                setLead(leadData);

                // Fetch lead groups (from primary_group_id and lead_groups_map)
                const allGroupIds = [];

                // Add primary_group_id if exists
                if (leadData.primary_group_id) {
                    allGroupIds.push(leadData.primary_group_id);
                }

                // Fetch groups from lead_groups_map
                const { data: groupMapData } = await fetchAll('lead_groups_map', '*', {
                    lead_id: id,
                });
                if (groupMapData && groupMapData.length > 0) {
                    const mapGroupIds = groupMapData.map((gm) => gm.lead_group_id);
                    allGroupIds.push(...mapGroupIds);
                }

                // Fetch all unique groups
                if (allGroupIds.length > 0) {
                    const uniqueGroupIds = [...new Set(allGroupIds)];
                    const { data: groupsData } = await fetchAll('lead_groups', '*', {
                        id: uniqueGroupIds,
                    });
                    setLeadGroups(groupsData || []);
                } else {
                    setLeadGroups([]);
                }

                // Fetch activities
                const { data: activitiesData } = await fetchAll('activities', '*', {
                    lead_id: id,
                });
                if (activitiesData) {
                    const sorted = activitiesData.sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    setLeadActivities(sorted);
                }

                // Fetch tasks
                const { data: tasksData } = await fetchAll('tasks', '*', {
                    lead_id: id,
                });
                setLeadTasks(tasksData || []);

                // Fetch campaigns (through primary_group_id and lead_groups_map)
                const allGroupIdsForCampaigns = [];

                // Add primary_group_id if exists
                if (leadData.primary_group_id) {
                    allGroupIdsForCampaigns.push(leadData.primary_group_id);
                }

                // Add groups from lead_groups_map
                if (groupMapData && groupMapData.length > 0) {
                    const mapGroupIds = groupMapData.map((gm) => gm.lead_group_id);
                    allGroupIdsForCampaigns.push(...mapGroupIds);
                }

                if (allGroupIdsForCampaigns.length > 0) {
                    const uniqueGroupIds = [...new Set(allGroupIdsForCampaigns)];

                    // Get campaigns that use these groups
                    const { data: campaignGroupsData } = await fetchAll('campaign_groups', '*', {
                        lead_group_id: uniqueGroupIds, // fetchAll handles arrays with .in()
                    });

                    if (campaignGroupsData && campaignGroupsData.length > 0) {
                        const campaignIds = [...new Set(campaignGroupsData.map((cg) => cg.campaign_id))];

                        // Fetch campaigns using array filter
                        const { data: campaignsData } = await fetchAll('campaigns', '*', {
                            id: campaignIds, // fetchAll handles arrays with .in()
                        });

                        setLeadCampaigns(campaignsData || []);
                    } else {
                        setLeadCampaigns([]);
                    }
                } else {
                    setLeadCampaigns([]);
                }

                // Fetch all user tags
                const { data: allTagsData } = await fetchAll('lead_tags', '*', {
                    user_id: userId,
                    is_active: true,
                });
                setAllUserTags(allTagsData || []);

                // Fetch tags (from lead_tag_map)
                const { data: tagMapData } = await fetchAll('lead_tag_map', '*', {
                    lead_id: id,
                });
                if (tagMapData && tagMapData.length > 0) {
                    const tagIds = tagMapData.map((tm) => tm.tag_id);
                    const { data: tagsData } = await fetchAll('lead_tags', '*', {
                        id: tagIds, // fetchAll handles arrays with .in()
                    });
                    setLeadTags(tagsData || []);
                } else {
                    setLeadTags([]);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeadData();
    }, [id, userId]);

    // Close tag dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showTagDropdown &&
                !event.target.closest('[data-tag-dropdown]') &&
                !event.target.closest('[data-tag-button]')
            ) {
                setShowTagDropdown(false);
            }
        };

        if (showTagDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTagDropdown]);

    if (!lead) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Lead not found</p>
            </div>
        );
    }

    const getActivityIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'note':
                return FileText;
            case 'call':
                return PhoneCall;
            case 'email':
                return MailIcon;
            case 'whatsapp':
                return MessageSquare;
            case 'task':
                return CheckSquare;
            case 'meeting':
                return Calendar;
            case 'visit':
                return MapPin;
            case 'follow_up':
                return CheckSquare;
            default:
                return FileText;
        }
    };

    // Filter visits from activities
    const leadVisits = leadActivities.filter((a) => a.activity_type?.toLowerCase() === 'visit');

    if (authLoading || isLoading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Lead not found</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden p-6">
            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0">
                {/* Left Column - Info Panel */}
                <div className="col-span-12 lg:col-span-3 space-y-4 overflow-hidden">
                    {/* Company Info */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Company Image */}
                        {lead.profile_image_url && (
                            <div className="w-full h-48 relative">
                                <button
                                    onClick={() => setShowImageModal(true)}
                                    className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                >
                                    <Image
                                        src={lead.profile_image_url}
                                        alt={lead.company || lead.name || 'Company'}
                                        fill
                                        className="object-cover"
                                        sizes="100vw"
                                    />
                                </button>
                                {/* Favorite Button - Top Right Corner */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite();
                                    }}
                                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors z-10"
                                    title={lead.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Heart
                                        size={20}
                                        className={lead.is_favorite ? 'text-red-500 fill-red-500' : 'text-slate-400'}
                                    />
                                </button>
                                <button
                                    onClick={() => router.back()}
                                    className="absolute top-3 left-3 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors z-10"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            </div>
                        )}

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-slate-800 mb-2">
                                        {lead.company || lead.name}
                                    </h2>

                                    {/* Rating and Review Count */}
                                    {(lead.rating || lead.review_count) && (
                                        <div className="flex items-center gap-2">
                                            {lead.rating && (
                                                <div className="flex items-center gap-1">
                                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-medium text-slate-800">
                                                        {lead.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                            {lead.review_count && (
                                                <span className="text-sm text-slate-500">
                                                    ({lead.review_count} {lead.review_count === 1 ? 'review' : 'reviews'})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Favorite Button - Next to Edit */}
                                    {!lead.profile_image_url && (
                                        <button
                                            onClick={handleToggleFavorite}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            title={lead.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <Heart
                                                size={18}
                                                className={lead.is_favorite ? 'text-red-500 fill-red-500' : 'text-slate-400'}
                                            />
                                        </button>
                                    )}
                                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Edit size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {lead.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-sm text-slate-500">Address</p>
                                            <p className="text-slate-800">{lead.address}</p>
                                        </div>
                                    </div>
                                )}

                                {lead.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone size={18} className="text-slate-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-500">Phone</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-slate-800">{formatPhoneNumber(lead.phone)}</p>
                                                {lead.has_whatsapp && (
                                                    <a
                                                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="relative group"
                                                        title="WhatsApp ile mesaj gönder"
                                                    >
                                                        <Image
                                                            src="/wp-icon.png"
                                                            alt="WhatsApp"
                                                            width={20}
                                                            height={20}
                                                            className="rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                        />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {lead.email && (
                                    <div className="flex items-start gap-3">
                                        <Mail size={18} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-sm text-slate-500">Email</p>
                                            <p className="text-slate-800">{lead.email}</p>
                                        </div>
                                    </div>
                                )}

                                {lead.website && (
                                    <div className="flex items-start gap-3">
                                        <Globe size={18} className="text-slate-400 mt-1" />
                                        <div>
                                            <p className="text-sm text-slate-500">Website</p>
                                            <a
                                                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                {lead.website}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {lead.google_maps_url && (
                                    <a
                                        href={lead.google_maps_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <Map size={18} />
                                        <span>Google Maps</span>
                                    </a>
                                )}

                                {lead.working_hours && typeof lead.working_hours === 'object' && (
                                    <div>
                                        <button
                                            onClick={() => setShowAllWorkingHours(!showAllWorkingHours)}
                                            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Clock size={18} className="text-slate-400" />
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-slate-700">Working Hours</p>
                                                    <p className="text-xs text-slate-500">
                                                        {todayInTurkish}: {lead.working_hours[todayInTurkish] || 'Bilinmiyor'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {showAllWorkingHours ? 'Gizle' : 'Tümünü Göster'}
                                            </span>
                                        </button>

                                        {showAllWorkingHours && (
                                            <div className="mt-2 space-y-2">
                                                {Object.entries(lead.working_hours).map(([day, hours]) => (
                                                    <div
                                                        key={day}
                                                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${day === todayInTurkish
                                                            ? 'bg-blue-50 border border-blue-200'
                                                            : 'bg-slate-50'
                                                            }`}
                                                    >
                                                        <span className={`text-sm ${day === todayInTurkish ? 'font-semibold text-blue-700' : 'text-slate-600'}`}>
                                                            {day}
                                                        </span>
                                                        <span className={`text-sm ${day === todayInTurkish ? 'font-semibold text-blue-700' : 'font-medium text-slate-800'}`}>
                                                            {hours}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column - Activity Timeline */}
                <div className="col-span-12 lg:col-span-6 space-y-4 overflow-hidden flex flex-col min-h-0">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        {/* Timeline Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-slate-800">Activity Timeline</h3>
                        </div>

                        {/* Timeline Content - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 min-h-0 scrollbar-modern">
                            <div className="relative">
                                {leadActivities.length > 0 ? (
                                    <div className="relative">
                                        {/* Timeline Vertical Line */}
                                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />

                                        <div className="space-y-6">
                                            {leadActivities.map((activity, index) => {
                                                const Icon = getActivityIcon(activity.activity_type);

                                                // Get icon color based on type
                                                const getIconColor = (type) => {
                                                    switch (type?.toLowerCase()) {
                                                        case 'note':
                                                            return 'bg-blue-500 text-white border-blue-600';
                                                        case 'call':
                                                            return 'bg-purple-500 text-white border-purple-600';
                                                        case 'email':
                                                            return 'bg-blue-500 text-white border-blue-600';
                                                        case 'whatsapp':
                                                            return 'bg-green-500 text-white border-green-600';
                                                        case 'task':
                                                            return 'bg-orange-500 text-white border-orange-600';
                                                        case 'meeting':
                                                            return 'bg-indigo-500 text-white border-indigo-600';
                                                        case 'visit':
                                                            return 'bg-orange-500 text-white border-orange-600';
                                                        case 'todo':
                                                            return 'bg-yellow-500 text-white border-yellow-600';
                                                        default:
                                                            return 'bg-slate-500 text-white border-slate-600';
                                                    }
                                                };

                                                return (
                                                    <div key={activity.id} className="relative flex gap-4 pl-2">
                                                        {/* Timeline Dot with Icon */}
                                                        <div className="flex-shrink-0 relative z-10">
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getIconColor(activity.activity_type)} shadow-sm`}>
                                                                <Icon size={20} />
                                                            </div>
                                                        </div>

                                                        {/* Message Bubble */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`rounded-xl p-4 border shadow-sm ${activity.status === 'pending'
                                                                ? 'bg-amber-50 border-amber-200'
                                                                : 'bg-slate-50 border-slate-200'
                                                                }`}>
                                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                                    <p className="text-sm text-slate-700 flex-1">{activity.content || ''}</p>
                                                                    {activity.status === 'pending' && (
                                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 rounded-lg flex-shrink-0">
                                                                            <Hourglass size={14} className="text-amber-600 animate-pulse" />
                                                                            <span className="text-xs font-medium text-amber-700">Pending</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Date/Time at bottom right */}
                                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                                                                    {/* Due date for pending activities */}
                                                                    {activity.status === 'pending' && activity.due_date && (
                                                                        <div className="px-2 py-1 bg-blue-50 rounded-lg border border-blue-100">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Calendar size={12} className="text-blue-600" />
                                                                                <span className="text-xs font-medium text-blue-700">
                                                                                    Due: {formatDate(activity.due_date)} {formatTime(activity.due_date)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {/* Created at */}
                                                                    <span className="text-xs text-slate-400">
                                                                        {formatTimeAgo(activity.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-8">No activities yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Lead Groups, Campaigns, Tags */}
                <div className="col-span-12 lg:col-span-3 space-y-4 overflow-hidden">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <button
                                onClick={() => {
                                    setSelectedActionType('note');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText size={20} className="text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Note</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('email');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <MailIcon size={20} className="text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Email</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('call');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <PhoneCall size={20} className="text-purple-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Call</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('whatsapp');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <MessageSquare size={20} className="text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Wp</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('visit');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <MapPin size={20} className="text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Visit</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('task');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <CheckSquare size={20} className="text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Task</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('meeting');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Calendar size={20} className="text-indigo-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Meeting</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedActionType('todo');
                                    setShowQuickActionPanel(true);
                                }}
                                className="flex flex-col items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <CheckSquare size={20} className="text-yellow-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">Todo</span>
                            </button>
                        </div>
                    </div>
                    {/* Lead Groups */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 mb-3">Belongs to Lead Groups</p>
                        <div className="space-y-2">
                            {leadGroups.length > 0 ? (
                                leadGroups.map((group) => {
                                    const isPrimary = lead?.primary_group_id === group.id;
                                    return (
                                        <Link
                                            key={group.id}
                                            href={`/lead-groups/${group.id}`}
                                            className="block p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm text-slate-800 relative"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{group.name}</span>
                                                {isPrimary && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-slate-400">No groups assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Campaigns */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-700 mb-3">Campaigns</p>
                        {leadCampaigns.length > 0 ? (
                            <div className="space-y-2">
                                {leadCampaigns.map((campaign) => {
                                    const getTypeColor = (type) => {
                                        switch (type?.toLowerCase()) {
                                            case 'whatsapp':
                                                return 'bg-green-100 text-green-700';
                                            case 'email':
                                                return 'bg-blue-100 text-blue-700';
                                            case 'call':
                                                return 'bg-purple-100 text-purple-700';
                                            case 'visit':
                                                return 'bg-orange-100 text-orange-700';
                                            default:
                                                return 'bg-slate-100 text-slate-700';
                                        }
                                    };
                                    return (
                                        <Link
                                            key={campaign.id}
                                            href={`/campaigns/${campaign.id}`}
                                            className="block p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Megaphone size={14} className="text-slate-500" />
                                                <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                    {campaign.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                                                        campaign.campaign_type
                                                    )}`}
                                                >
                                                    {campaign.campaign_type ? campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1) : '-'}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${campaign.status?.toLowerCase() === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {campaign.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : '-'}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">No campaigns yet</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-slate-700">Tags</p>
                            <div className="relative" data-tag-dropdown>
                                <button
                                    data-tag-button
                                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Add tag"
                                >
                                    <Plus size={16} className="text-slate-600" />
                                </button>

                                {/* Tag Dropdown */}
                                {showTagDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-20 max-h-60 overflow-y-auto scrollbar-modern">
                                        <div className="p-2">
                                            {allUserTags.length > 0 ? (
                                                <div className="space-y-1">
                                                    {allUserTags.map((tag) => {
                                                        const isSelected = leadTags.some((t) => t.id === tag.id);
                                                        return (
                                                            <button
                                                                key={tag.id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveTag(tag.id);
                                                                    } else {
                                                                        handleAddTag(tag.id);
                                                                    }
                                                                    setShowTagDropdown(false);
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                                                        ? 'bg-blue-50 hover:bg-blue-100'
                                                                        : 'hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full"
                                                                        style={{ backgroundColor: tag.color }}
                                                                    />
                                                                    <span className="text-slate-800">{tag.name}</span>
                                                                </div>
                                                                {isSelected && (
                                                                    <CheckSquare size={16} className="text-blue-600" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 p-3 text-center">
                                                    No tags available. Create tags in Settings.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {leadTags.length > 0 ? (
                                leadTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="group relative px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
                                        style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                        }}
                                    >
                                        <span>{tag.name}</span>
                                        <button
                                            onClick={() => handleRemoveTag(tag.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 rounded"
                                            title="Remove tag"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No tags assigned</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Panel */}
            {showQuickActionPanel && lead && userId && (
                <QuickActionPanel
                    lead={lead}
                    userId={userId}
                    initialActionType={selectedActionType}
                    onClose={() => {
                        setShowQuickActionPanel(false);
                        setSelectedActionType(null);
                    }}
                    onActivityAdded={() => {
                        // Refresh activities
                        const fetchActivities = async () => {
                            try {
                                const { data: activitiesData } = await fetchAll('activities', '*', {
                                    lead_id: lead.id,
                                });
                                if (activitiesData) {
                                    const sorted = activitiesData.sort(
                                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                                    );
                                    setLeadActivities(sorted);
                                }
                            } catch (error) {
                                console.error('Error fetching activities:', error);
                            }
                        };
                        fetchActivities();
                    }}
                />
            )}

            {/* Image Modal */}
            {showImageModal && lead.profile_image_url && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-slate-100 transition-colors z-10"
                        >
                            <X size={24} className="text-slate-800" />
                        </button>
                        <div
                            className="relative w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={lead.profile_image_url}
                                alt={lead.company || lead.name || 'Company'}
                                fill
                                className="object-contain rounded-lg"
                                sizes="90vw"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

