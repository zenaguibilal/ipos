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

const RecurrenceBadge = ({ ligne }: { ligne: LigneCommandePain }) => {
    const { type_recurrence, jours_semaine } = ligne;
    
    if (type_recurrence === 'quotidien') {
        return <Badge className="text-xs bg-blue-500/20 text-blue-300">Quotidien</Badge>;
    }
    if (type_recurrence === 'aucun') {
        return <Badge className="text-xs bg-gray-500/20 text-gray-300">Manuel</Badge>;
    }
    if (type_recurrence === 'jours_specifiques') {
        const activeDays = Object.entries(jours_semaine)
            .filter(([, val]) => val.actif)
            .map(([key]) => key.substring(0, 3));
        
        const label = activeDays.length > 3 
            ? `${activeDays.slice(0,2).join(', ')}... (${activeDays.length})` 
            : activeDays.join(', ');
        
        return <Badge className="text-xs bg-orange-500/20 text-orange-300 capitalize">{label || 'Jours Spécifiques'}</Badge>;
    }
    return null;
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
                        <RecurrenceBadge ligne={ligne}/>
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
                    <div className="grid grid-cols-3 gap-1 w-full">
                         <Button 
                            variant={currentStatus === 'en_attente' ? 'secondary' : 'ghost'} 
                            onClick={() => handleStatusChange('en_attente')}
                            disabled={!ligne.commandeDuJour}
                            className="h-9"
                        >En attente</Button>
                         <Button 
                            variant={currentStatus === 'livre' ? 'secondary' : 'ghost'} 
                            onClick={() => handleStatusChange('livre')}
                            disabled={!ligne.commandeDuJour}
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
