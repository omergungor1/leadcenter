'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
    LayoutDashboard,
    Users,
    User,
    Megaphone,
    CheckSquare,
    Settings,
    UserCircle,
    Menu,
    X,
    Heart,
    CreditCard,
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Lead Groups', path: '/lead-groups' },
    { icon: User, label: 'Leads', path: '/leads' },
    { icon: Megaphone, label: 'Campaigns', path: '/campaigns' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Heart, label: 'Favorites', path: '/favorites' },
];

const bottomMenuItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: UserCircle, label: 'Profile', path: '/profile' },
    { icon: CreditCard, label: 'Account', path: '/account' },
];

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const pathname = usePathname();

    const isExpanded = isHovered || !isCollapsed;

    return (
        <div
            className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-40 ${isExpanded ? 'w-64' : 'w-20'
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-6 border-b border-slate-200">
                    {isExpanded ? (
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="LeadCenter"
                                width={32}
                                height={32}
                                className="rounded-lg"
                            />
                            <span className="font-semibold text-slate-800">Lead Center</span>
                        </div>
                    ) : (
                        <Image
                            src="/logo.png"
                            alt="Lead Center Logo"
                            width={32}
                            height={32}
                            className="rounded-lg mx-auto"
                        />
                    )}
                    {isExpanded && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                    )}
                </div>

                {/* Main Menu */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={20} />
                                {isExpanded && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Menu */}
                <div className="px-3 py-4 border-t border-slate-200 space-y-1">
                    {bottomMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={20} />
                                {isExpanded && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

