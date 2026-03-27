'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Save, ChevronsUpDown, Plus, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import type { Supplier, Product } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductIntakeCombobox } from '@/components/stock/ProductIntakeCombobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { api } from '@/lib/api-client';

/**
 * @fileOverview New Stock Intake Page
 * Purged: unused icon imports (AlertTriangle).
 */

interface LocalIntakeItem {
    id: string;
    productUuid?: string;
    name: string;
    quantityReceived: number;
    quantityDamaged: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
    unite: Product['unite'];
    category?: string;
}

export default function NewStockIntakePage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { processStockIntake } = useAppActions();
    
    const [supplierUuid, setSupplierUuid] = useState<string>('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
    
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [transportFees, setTransportFees] = useState(0);
    const [items, setItems] = useState<LocalIntakeItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);

    useEffect(() => {
        if (!isManagerOrAdmin) {
            toast.error("Accès non autorisé.");
            router.replace('/sell');
        }
    }, [isManagerOrAdmin, router]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await api.get<Supplier[]>('suppliers');
                setSuppliers(data);
            } catch (error: any) {
                toast.error("Impossible de charger les fournisseurs.");
            }
        };
        fetchSuppliers();
    }, []);

    const supplierOptions = useMemo(() => {
        if (!suppliers) return [];
        if (!supplierSearch) return suppliers;
        return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
    }, [suppliers, supplierSearch]);


    const handleAddProduct = useCallback((product: any) => {
        const existingItemIndex = items.findIndex(item => item.productUuid === product.uuid);
        if (existingItemIndex > -1) {
            const newItems = [...items];
            newItems[existingItemIndex].quantityReceived += 1;
            setItems(newItems);
            toast.info(`Quantité de "${product.name}" augmentée.`);
        } else {
            setItems(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    productUuid: product.uuid,
                    name: product.name,
                    quantityReceived: 1,
                    quantityDamaged: 0,
                    purchasePrice: product.purchasePrice,
                    price: product.price,
                    isNew: false,
                    unite: product.unite || 'Pièce',
                    category: product.category,
                }
            ]);
        }
    }, [items]);
    
    const handleAddNewItem = useCallback((name: string) => {
        const newItem: LocalIntakeItem = {
            id: uuidv4(),
            name: name,
            quantityReceived: 1,
            quantityDamaged: 0,
            purchasePrice: 0,
            price: 0,
            isNew: true,
            unite: 'Pièce',
            category: 'Non classé',
        };
        setItems(prev => [...prev, newItem]);
    }, []);

    const handleItemChange = (id: string, field: keyof LocalIntakeItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'purchasePrice' || field === 'quantityReceived') {
                    if (updatedItem.isNew && updatedItem.price === 0) {
                        updatedItem.price = parseFloat(String(updatedItem.purchasePrice)) * 1.2;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotalValue = items.reduce((acc, item) => acc + (item.quantityReceived * item.purchasePrice), 0);
    const totalIntakeValue = subtotalValue + transportFees;
    
    const transportRatio = subtotalValue > 0 ? transportFees / subtotalValue : 0;

    const handleSave = async () => {
        if (!supplierName) {
            toast.error("Veuillez remplir le nom du fournisseur.");
            return;
        }
        if (items.length === 0) {
            toast.error("Veuillez ajouter au moins un produit à la réception.");
            return;
        }

        for (const item of items) {
            if (!item.name || item.quantityReceived <= 0 || item.purchasePrice < 0) {
                toast.error(`Veuillez remplir les informations pour l'article "${item.name || 'Nouvel article'}".`);
                return;
            }
             if (item.quantityDamaged > item.quantityReceived) {
                toast.error(`La quantité endommagée ne peut pas dépasser la quantité reçue pour "${item.name}".`);
                return;
            }
        }

        setIsSaving(true);
        const processedItems = items.map(item => ({
            ...item,
            costPrice: item.purchasePrice * (1 + transportRatio),
            productName: item.name
        }));

        const success = await processStockIntake({
            supplierName,
            supplierUuid: supplierUuid || undefined,
            invoiceNumber,
            invoiceDate: invoiceDate?.toISOString() || new Date().toISOString(),
            items: processedItems,
            totalValue: subtotalValue,
            transportFees: transportFees
        });

        if (success) {
            toast.success("Réception enregistrée.");
            router.push('/stock');
        } else {
            toast.error("Échec de l'enregistrement.");
        }
        setIsSaving(false);
    };

    const handleSupplierSelect = (uuid: string) => {
        const selected = suppliers?.find(s => s.uuid === uuid);
        if (selected) {
            setSupplierUuid(selected.uuid);
            setSupplierName(selected.name);
        }
        setSupplierPopoverOpen(false);
    };

    const handleSupplierCreate = () => {
        setSupplierUuid('');
        setSupplierName(supplierSearch);
        setSupplierPopoverOpen(false);
    };
    
    if (!isManagerOrAdmin) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Nouvelle Réception & Coût de Revient"
                description="Répartissez vos frais de transport sur vos produits pour calculer vos coûts réels."
            >
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer la réception'}
                    </Button>
                </div>
            </PageHeader>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Fournisseur</Label>
                            <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {supplierName || "Sélectionner ou créer un fournisseur..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Rechercher..." onValueChange={setSupplierSearch} />
                                        <CommandList>
                                            <CommandEmpty>
                                                <Button variant="link" className="w-full" onClick={handleSupplierCreate}>
                                                    <Plus className="mr-2 h-4 w-4" /> Créر "{supplierSearch}"
                                                </Button>
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {supplierOptions?.map((supplier) => (
                                                    <CommandItem key={supplier.uuid} onSelect={() => handleSupplierSelect(supplier.uuid)}>
                                                        {supplier.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">N° de Facture / Bon</Label>
                            <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Ex: INV-998" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date de réception</Label>
                            <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transport" className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-primary" /> Frais de Transport (DA)
                            </Label>
                            <Input 
                                id="transport" 
                                type="number" 
                                value={transportFees} 
                                onChange={e => setTransportFees(parseFloat(e.target.value) || 0)} 
                                className="border-primary/30 focus:border-primary font-bold text-lg"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-bold text-lg border-b pb-2">Récapitulatif Financier</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Marchandise :</span>
                                <span className="font-semibold">{formatCurrency(subtotalValue)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-primary">
                                <span>Transport :</span>
                                <span className="font-bold">+ {formatCurrency(transportFees)}</span>
                            </div>
                            <div className="pt-4 flex justify-between items-center border-t border-primary/20">
                                <span className="text-lg font-black">TOTAL :</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(totalIntakeValue)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic text-center mt-4">
                                * Les frais de transport seront répartis au prorata de la valeur de chaque article.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Articles & Coût de Revient</h3>
                        <Badge variant="outline" className="text-xs bg-muted">
                            Impact transport : +{Math.round(transportRatio * 100)}% par article
                        </Badge>
                    </div>
                    
                    <ProductIntakeCombobox 
                        onProductSelected={handleAddProduct}
                        onNewProductCreated={handleAddNewItem}
                    />
                    
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/20">
                                    <th className="p-3 text-left min-w-[200px]">Produit</th>
                                    <th className="p-3 text-center w-24">Qté</th>
                                    <th className="p-3 text-right w-32">Prix Achat U.</th>
                                    <th className="p-3 text-right w-32 bg-primary/5 text-primary">Revient U.</th>
                                    <th className="p-3 text-right w-32">Prix Vente U.</th>
                                    <th className="p-3 text-right w-32">Marge Finale</th>
                                    <th className="p-3 text-right w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const unitRevient = item.purchasePrice * (1 + transportRatio);
                                    const unitMargin = item.price - unitRevient;
                                    const isLoss = item.price > 0 && unitRevient > 0 && item.price < unitRevient;
                                    
                                    return (
                                        <tr key={item.id} className="border-b hover:bg-muted/10 transition-colors">
                                            <td className="p-3">
                                                {item.isNew ? (
                                                    <Input className="h-8" placeholder="Nom..." value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                                ) : <span className="font-medium">{item.name}</span>}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Input type="number" className="h-8 w-20 mx-auto text-center" value={item.quantityReceived} onChange={e => handleItemChange(item.id, 'quantityReceived', parseInt(e.target.value) || 0)} />
                                            </td>
                                            <td className="p-3">
                                                <Input type="number" step="0.1" className="h-8 w-28 ml-auto text-right" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="p-3 text-right font-black text-primary bg-primary/5">
                                                {unitRevient.toFixed(1)}
                                            </td>
                                            <td className="p-3">
                                                <Input type="number" step="0.1" className="h-8 w-28 ml-auto text-right" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} disabled={!item.isNew} />
                                            </td>
                                            <td className="p-3 text-right">
                                                <Badge variant="outline" className={cn(
                                                    "font-bold",
                                                    isLoss ? "text-destructive border-destructive" : "text-green-500 border-green-500"
                                                )}>
                                                    {unitMargin.toFixed(1)} DA
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-muted-foreground italic">
                                            Scannez ou recherchez un produit pour commencer le calcul du coût de revient.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}