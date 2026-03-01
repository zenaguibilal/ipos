'use client';

import React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone } from 'lucide-react';
import Link from 'next/link';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

const CustomerCardComponent = ({ customer, onEdit, onDelete }: CustomerCardProps) => {
    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">
                            <Link href={`/customers/${customer.id}`} className="hover:underline">
                                {customer.firstName} {customer.lastName}
                            </Link>
                        </CardTitle>
                         {customer.phone && (
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/${customer.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Voir les détails
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground">Informations de base du client.</p>
            </CardContent>
        </Card>
    );
}

export const CustomerCard = React.memo(CustomerCardComponent);
