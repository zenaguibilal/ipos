'use client';

import React, { useState } from 'react';
import type { LigneCommandePain } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Edit, Send, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/data-service';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { ModifierPainCommandeDialog } from './EditOrderDialog';

interface PainCommandeCarteProps {
    ligne: LigneCommandePain;
    date: string;
    isSelected: boolean;
    onSelect?: () => void;
}

const statusConfig = {
    en_attente: { label: "En attente", color: "bg-gray-500", icon: Send },
    livre: { label: "Livré", color: "bg-blue-500", icon: Check },
    paye: { label: "Payé", color: "bg-green-500", icon: Check },
};

const RecurrenceBadge = ({ type }: { type: LigneCommandePain['type_recurrence'] }) => {
    const config = {
        quotidien: { label: "Quotidien", color: "bg-blue-500/20 text-blue-300" },
        jours_specifiques: { label: "Jours Spécifiques", color: "bg-orange-500/20 text-orange-300" },
        aucun: { label: "Manuel", color: "bg-gray-500/20 text-gray-300" },
    };
    const { label, color } = config[type];
    return <Badge className={cn("text-xs", color)}>{label}</Badge>;
}

const PainCommandeCarteComponent = ({ ligne, date, isSelected, onSelect }: PainCommandeCarteProps) => {
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleStatusChange = async (newStatus: 'en_attente' | 'livre' | 'paye') => {
        if (!ligne.commandeDuJour) return;
        try {
            await dataService.updateCommandePainStatut(ligne.commandeDuJour.id!, newStatus);
        } catch (e: any) {
            toast.error("Erreur", { description: e.message });
        }
    };
    
    const handleUndo = async () => {
         if (!ligne.commandeDuJour) return;
        try {
            const defaultQty = dataService.getQuantitePainParDefautPourJour(ligne, new Date(date));
            await dataService.updateCommandePainQuantite(ligne.commandeDuJour.id!, defaultQty);
        } catch(e: any) {
             toast.error("Erreur", { description: e.message });
        }
    };
    
    const currentStatus = ligne.commandeDuJour?.statut || 'en_attente';
    const statusInfo = statusConfig[currentStatus];

    return (
        <>
            <Card className={cn("flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative", isSelected && "ring-2 ring-primary/80")}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{ligne.nom}</CardTitle>
                        {onSelect && ligne.commandeDuJour && (
                             <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={onSelect}
                                disabled={currentStatus === 'paye'}
                                className="h-5 w-5 rounded border-primary text-primary focus:ring-primary disabled:opacity-50"
                            />
                        )}
                    </div>
                    <CardDescription>
                        <RecurrenceBadge type={ligne.type_recurrence}/>
                    </CardDescription>
                </CardHeader>
                 <CardContent className="flex-grow flex flex-col justify-center items-center gap-2 text-center relative">
                    {ligne.estModifie && (
                        <div className="absolute top-0 right-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleUndo}>
                                <Undo className="h-3 w-3"/>
                            </Button>
                        </div>
                    )}
                    <p className="text-6xl font-bold">{ligne.commandeDuJour?.quantite ?? '-'}</p>
                    <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} disabled={!ligne.commandeDuJour}>
                        <Edit className="mr-2 h-3 w-3" /> Modifier
                    </Button>
                </CardContent>
                <CardFooter className="p-1">
                    <div className="grid grid-cols-2 gap-1 w-full">
                         <Button 
                            variant={currentStatus === 'livre' ? 'secondary' : 'ghost'} 
                            onClick={() => handleStatusChange('livre')}
                            disabled={!ligne.commandeDuJour || currentStatus === 'paye'}
                            className="h-9"
                        >Livré</Button>
                        <Button 
                            variant={currentStatus === 'paye' ? 'secondary' : 'ghost'} 
                            onClick={() => handleStatusChange('paye')}
                            disabled={!ligne.commandeDuJour}
                             className="h-9"
                        >Payé</Button>
                    </div>
                </CardFooter>
            </Card>
            {ligne.commandeDuJour && (
                 <ModifierPainCommandeDialog 
                    isOpen={isEditOpen} 
                    onOpenChange={setIsEditOpen} 
                    commande={ligne.commandeDuJour} 
                />
            )}
        </>
    );
};

export const PainCommandeCarte = React.memo(PainCommandeCarteComponent);
