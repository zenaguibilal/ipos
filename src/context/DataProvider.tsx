'use client';

import React, { createContext, ReactNode } from 'react';
import { getDataService } from '@/services/data-service';

// We can type the context to expect an instance of our DataService
const DataContext = createContext<ReturnType<typeof getDataService> | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    // The service is initialized as a singleton, so this just gets the instance
    const dataService = getDataService();

    return (
        <DataContext.Provider value={dataService}>
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
