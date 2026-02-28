'use client';

import { useContext } from 'react';
import DataContext from '@/context/DataProvider';
import { getDataService } from '@/services/data-service';

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        // This might happen during server-side rendering or if the provider is missing.
        // We can return the singleton instance directly as a fallback.
        return getDataService();
    }
    return context;
};
