import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabBarContextType {
    isTabBarVisible: boolean;
    showTabBar: () => void;
    hideTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
    const [isTabBarVisible, setIsTabBarVisible] = useState(true);

    const showTabBar = useCallback(() => {
        setIsTabBarVisible(true);
    }, []);

    const hideTabBar = useCallback(() => {
        setIsTabBarVisible(false);
    }, []);

    return (
        <TabBarContext.Provider value={{ isTabBarVisible, showTabBar, hideTabBar }}>
            {children}
        </TabBarContext.Provider>
    );
}

export function useTabBar() {
    const context = useContext(TabBarContext);
    if (context === undefined) {
        throw new Error('useTabBar must be used within a TabBarProvider');
    }
    return context;
}

export default TabBarContext;
