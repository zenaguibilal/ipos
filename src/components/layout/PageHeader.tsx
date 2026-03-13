'use client';
import React from 'react';

interface PageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <header className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
            </div>
            {children && (
                 <div className="flex gap-2 w-full sm:w-auto">
                    {children}
                 </div>
            )}
        </header>
    );
}
