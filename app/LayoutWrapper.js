'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    // Don't show sidebar and topbar on login page
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Show sidebar and topbar for all other pages
    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-20 lg:ml-64">
                <TopBar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

