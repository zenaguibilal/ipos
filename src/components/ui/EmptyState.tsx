'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    children?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
    return (
        <div className={cn("text-center py-16", className)}>
            <Icon className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold mt-4">{title}</h3>
            <p className="text-muted-foreground mt-2">{description}</p>
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}
