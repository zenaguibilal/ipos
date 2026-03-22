'use client';

import { useState, useMemo, useEffect } from 'react';
import { dataService } from '@/services/data-service';
import type { CompanyProfile, ZakatData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight, Minus, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

const ZAKAT_RATE = 0.025;
const NISAB_GOLD_GRAMS = 85;

export default function ZakatPage() {
    const [cashOnHand, setCashOnHand] = useState('');
    const [debts, setDebts] = useState('');

    const [zakatData, setZakatData] = useState<ZakatData | undefined>(undefined);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            dataService.getZakatData(),
            dataService.getCompanyProfile()
        ]).then(([zakat, profile]) => {
            setZakatData(zakat);
            setCompanyProfile(profile);
            setIsLoading(false);
        });
    }, []);

    const nisabAmount = useMemo(() => {
        const goldPrice = companyProfile?.goldPricePerGram || 0;
        return goldPrice * NISAB_GOLD_GRAMS;
    }, [companyProfile]);

    const zakatBase = useMemo(() => {
        const inventory = zakatData?.inventoryValue || 0;
        const receivables = zakatData?.totalReceivables || 0;
        const cash = parseFloat(cashOnHand) || 0;
        const liabilities = parseFloat(debts) || 0;
        return inventory + receivables + cash - liabilities;
    }, [zakatData, cashOnHand, debts]);
    
    const isZakatDue = zakatBase >= nisabAmount;
    const zakatAmount = isZakatDue ? zakatBase * ZAKAT_RATE : 0;

    const renderValue = (label: string, value: number, icon: React.ReactNode, className?: string, isInput: boolean = false, placeholder?: string, onChange?: (val: string) => void) => (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
                {icon}
                <Label htmlFor={isInput ? label : undefined} className="text-base text-muted-foreground">{label}</Label>
            </div>
            {isInput ? (
                <Input
                    id={label}
                    type="number"
                    className="w-48 h-10 text-right text-lg font-semibold"
                    placeholder={placeholder}
                    value={onChange ? (value === 0 ? '' : String(value)) : undefined}
                    onChange={(e) => onChange?.(e.target.value)}
                    defaultValue={value}
                />
            ) : (
                <span className={`text-lg font-bold ${className}`}>{formatCurrency(value)}</span>
            )}
        </div>
    );

    if (isLoading) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Calculateur de Zakat Commerciale"
                description="Estimez la Zakat due sur vos actifs commerciaux."
            />

            {!companyProfile?.goldPricePerGram && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Prix de l'or non configuré !</AlertTitle>
                    <AlertDescription>
                        Veuillez définir le "Prix de l'or par gramme" dans <a href="/profile" className="font-bold underline">Profil & Paramètres</a> pour calculer le Nisab.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>1. Calcul de la Base de Zakat (assiette)</CardTitle>
                        <CardDescription>
                            L'assiette est la somme des actifs commerciaux moins les dettes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {renderValue("Valeur du stock", zakatData?.inventoryValue ?? 0, <div className="p-2 bg-primary/10 rounded-full"><Plus className="w-4 h-4 text-primary" /></div>)}
                        {renderValue("Créances clients", zakatData?.totalReceivables ?? 0, <div className="p-2 bg-primary/10 rounded-full"><Plus className="w-4 h-4 text-primary" /></div>)}
                        {renderValue("Liquidités (en caisse, banque)", parseFloat(cashOnHand) || 0, <div className="p-2 bg-primary/10 rounded-full"><Plus className="w-4 h-4 text-primary" /></div>, '', true, '0', setCashOnHand)}
                        {renderValue("Dettes commerciales", parseFloat(debts) || 0, <div className="p-2 bg-destructive/10 rounded-full"><Minus className="w-4 h-4 text-destructive" /></div>, 'text-destructive', true, '0', setDebts)}
                        
                        <div className="flex items-center justify-between p-4 bg-muted/80 rounded-lg mt-4">
                            <Label className="text-lg font-semibold">Total de l'assiette de Zakat</Label>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(zakatBase)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>2. Résultat du Calcul</CardTitle>
                         <CardDescription>
                            La Zakat est due si l'assiette atteint le Nisab (seuil).
                        </CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <Label className="text-base text-muted-foreground">Nisab (seuil de 85g d'or)</Label>
                            <span className="text-lg font-bold text-chart-secondary">{formatCurrency(nisabAmount)}</span>
                        </div>

                        <div className="flex items-center justify-center p-4">
                            {isZakatDue ? (
                                <div className="text-center">
                                    <p className="text-chart-quaternary">L'assiette de la Zakat a dépassé le Nisab.</p>
                                    <p className="text-sm text-muted-foreground">La Zakat est donc applicable.</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-chart-secondary">L'assiette de la Zakat n'a pas atteint le Nisab.</p>
                                     <p className="text-sm text-muted-foreground">La Zakat n'est pas due cette année.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 rounded-lg bg-chart-quaternary/10 border border-chart-quaternary/20 text-center">
                            <Label className="text-lg font-semibold text-chart-quaternary">Montant de la Zakat à payer</Label>
                            <p className="text-4xl font-bold text-chart-quaternary mt-2">{formatCurrency(zakatAmount)}</p>
                            {isZakatDue && <p className="text-sm text-chart-quaternary/80 mt-1">({formatCurrency(zakatBase)} x 2.5%)</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Avis de non-responsabilité</AlertTitle>
                <AlertDescription>
                    Cet outil est une aide au calcul. Il est de votre responsabilité de vérifier les montants et de consulter une autorité religieuse compétente pour toute question. Les calculs sont basés sur une année lunaire (Haul).
                </AlertDescription>
            </Alert>
        </div>
    );
}
