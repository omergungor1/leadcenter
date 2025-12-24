'use client';

import { createContext, useContext, useState } from 'react';

const ActivityModeContext = createContext();

export function ActivityModeProvider({ children }) {
    const [activityMode, setActivityMode] = useState({
        isActive: false,
        campaignId: null,
        campaignName: null,
        campaignType: null,
        leads: [],
        currentIndex: 0,
    });

    const startActivityMode = (campaignId, campaignName, campaignType, leads) => {
        setActivityMode({
            isActive: true,
            campaignId,
            campaignName,
            campaignType,
            leads,
            currentIndex: 0,
        });
    };

    const exitActivityMode = () => {
        setActivityMode({
            isActive: false,
            campaignId: null,
            campaignName: null,
            campaignType: null,
            leads: [],
            currentIndex: 0,
        });
    };

    const goToNextLead = () => {
        setActivityMode(prev => ({
            ...prev,
            currentIndex: Math.min(prev.currentIndex + 1, prev.leads.length - 1),
        }));
    };

    const goToPreviousLead = () => {
        setActivityMode(prev => ({
            ...prev,
            currentIndex: Math.max(prev.currentIndex - 1, 0),
        }));
    };

    const getCurrentLead = () => {
        if (!activityMode.isActive || activityMode.leads.length === 0) return null;
        return activityMode.leads[activityMode.currentIndex];
    };

    return (
        <ActivityModeContext.Provider
            value={{
                activityMode,
                startActivityMode,
                exitActivityMode,
                goToNextLead,
                goToPreviousLead,
                getCurrentLead,
            }}
        >
            {children}
        </ActivityModeContext.Provider>
    );
}

export function useActivityMode() {
    const context = useContext(ActivityModeContext);
    if (!context) {
        throw new Error('useActivityMode must be used within an ActivityModeProvider');
    }
    return context;
}


