'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2, CalendarDays, Wheat, Settings2, Info } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BREAD_WEEK_DAY_LABELS_FULL } from '@/lib/constants';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

const initialFormState: Partial<Customer> = {
    isBreadClient: true,
    bread_type_recurrence: 'quotidien',
    bread_quantite_defaut: 10,
    bread_jours_semaine: {
        lundi:    { actif: true, quantite: 10 },
        mardi:    { actif: true, quantite: 10 },
        mercredi: { actif: true, quantite: 10 },
        jeudi:    { actif: true, quantite: 10 },
        vendredi: { actif: false, quantite: 0 },
        samedi:   { actif: true, quantite: 10 },
        dimanche: { actif: true, quantite: 10 }
    }
};

interface BreadClientFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: () => void;
}

export function BreadClientForm({ isOpen, onOpenChange, customer, onSuccess }: BreadClientFormProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                isBreadClient: customer.isBreadClient ?? true,
                bread_type_recurrence: customer.bread_type_recurrence || 'aucun',
                bread_quantite_defaut: customer.bread_quantite_defaut || 10,
                bread_jours_semaine: customer.bread_jours_semaine || initialFormState.bread_jours_semaine!
            });
        } else {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer?.uuid) return;

        setIsLoading(true);
        try {
            const dataToSave: Partial<Customer> = {
                isBreadClient: formState.isBreadClient,
                bread_type_recurrence: formState.bread_type_recurrence,
            };

            if (formState.bread_type_recurrence === 'quotidien') {
                dataToSave.bread_quantite_defaut = formState.bread_quantite_defaut;
            } else if (formState.bread_type_recurrence === 'jours_specifiques') {
                dataToSave.bread_jours_semaine = formState.bread_jours_semaine;
            }

            await api.put(`customers/${customer.uuid}`, dataToSave);
            toast.success(`Profil de distribution gravé pour ${customer.firstName}.`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Échec de la synchronisation souveraine.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDayToggle = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL) => {
        setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], actif: !prev.bread_jours_semaine![day].actif }
            }
        }));
    };

    const handleDayQuantityChange = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL, value: string) => {
         const quantite = parseInt(value, 10) || 0;
         setFormState(prev => ({
            ...prev,
            bread_jours_semaine: {
                ...prev.bread_jours_semaine!,
                [day]: { ...prev.bread_jours_semaine![day], quantite }
            }
        }));
    };

    if (!customer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl luxury-glass border-primary/20 p-0 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                                <Wheat className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Configuration Abonné</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">
                                    Décret de distribution pour {customer.firstName} {customer.lastName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-background/40 border border-white/5 shadow-inner">
                            <div className="space-y-1">
                                <Label htmlFor="isBreadClient" className="text-sm font-black uppercase tracking-tight">Activer l'Abonnement</Label>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-60">Inclusion dans le planning automatique</p>
                            </div>
                            <Switch id="isBreadClient" checked={formState.isBreadClient} onCheckedChange={(checked) => setFormState(s => ({ ...s, isBreadClient: checked }))} className="data-[state=checked]:bg-primary" />
                        </div>

                        {formState.isBreadClient && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Architecture de Récurence</Label>
                                    <Select value={formState.bread_type_recurrence} onValueChange={(value) => setFormState(s => ({ ...s, bread_type_recurrence: value as any }))}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-background/40 border-white/10 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="luxury-glass border-white/10">
                                            <SelectItem value="quotidien" className="font-bold py-3">⚡ Quotidien (Même volume chaque jour)</SelectItem>
                                            <SelectItem value="jours_specifiques" className="font-bold py-3">📅 Jours Spécifiques (Planning sur mesure)</SelectItem>
                                            <SelectItem value="aucun" className="font-bold py-3">🔘 Manuel uniquement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formState.bread_type_recurrence === 'quotidien' && (
                                    <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4 shadow-inner">
                                        <Label htmlFor="bread_quantite_defaut" className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <Settings2 className="h-4 w-4" /> Volume Fixe Quotidien
                                        </Label>
                                        <Input 
                                            id="bread_quantite_defaut" 
                                            type="number" 
                                            value={formState.bread_quantite_defaut} 
                                            onChange={(e) => setFormState(s => ({ ...s, bread_quantite_defaut: parseInt(e.target.value) || 0 }))} 
                                            className="h-20 text-5xl font-black text-center rounded-2xl bg-background/60 border-primary/20 focus:border-primary tracking-tighter"
                                        />
                                        <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nombre de pièces livrées chaque matin</p>
                                    </div>
                                )}

                                {formState.bread_type_recurrence === 'jours_specifiques' && (
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Planning Hebdomadaire</Label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {Object.entries(BREAD_WEEK_DAY_LABELS_FULL).map(([key, label]) => (
                                                <div key={key} className={cn(
                                                    "flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all",
                                                    formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif 
                                                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                                                        : "bg-muted/10 border-white/5 opacity-50"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <Switch 
                                                            id={key} 
                                                            checked={formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif} 
                                                            onCheckedChange={() => handleDayToggle(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL)} 
                                                            className="data-[state=checked]:bg-primary"
                                                        />
                                                        <Label htmlFor={key} className="font-bold text-sm uppercase tracking-tight">{label}</Label>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Input 
                                                            type="number" 
                                                            className="w-24 h-10 text-center font-black bg-background border-white/10 rounded-xl" 
                                                            value={formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].quantite}
                                                            onChange={e => handleDayQuantityChange(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL, e.target.value)}
                                                            disabled={!formState.bread_jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif}
                                                        />
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Pcs</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator className="bg-white/5" />

                        <div className="p-5 rounded-2xl bg-muted/20 border border-white/5 flex items-start gap-4">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                "La modification de ces réglages n'affecte pas les commandes déjà générées pour aujourd'hui. Les changements s'appliqueront lors du prochain cycle de génération automatique."
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-white/5 border-t border-white/5 gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-14 px-10 font-black uppercase text-[10px] tracking-widest">Annuler</Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading} 
                            className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-12 shadow-2xl shadow-primary/30 font-black uppercase text-[11px] tracking-[0.2em] gap-3 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarDays className="h-5 w-5" />}
                            Graver l'Abonnement
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
