'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    // Always start with false to avoid hydration mismatch
    // Sidebar will notify us via onCollapseChange callback when it loads from localStorage
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Don't show sidebar and topbar on login page
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Show sidebar and topbar for all other pages
    return (
        <div className="flex h-screen">
            <Sidebar onCollapseChange={setIsSidebarCollapsed} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-20 lg:ml-64'}`}>
                <TopBar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

