'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Save, AlertTriangle, ChevronsUpDown, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import type { StockIntakeItem, Supplier } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductIntakeCombobox } from '@/components/stock/ProductIntakeCombobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { stockService } from '@/services/stock.service';
import { supplierService } from '@/services/supplier.service';

export default function NewStockIntakePage() {
    const router = useRouter();
    const [supplierUuid, setSupplierUuid] = useState<string>('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
    
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const data = await supplierService.getSuppliers();
                setSuppliers(data);
            } catch (error) {
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
            newItems[existingItemIndex].quantity += 1;
            setItems(newItems);
            toast.info(`Quantité de "${product.name}" augmentée.`);
        } else {
            setItems(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    productUuid: product.uuid,
                    name: product.name,
                    barcodes: product.barcodes || [],
                    category: product.category,
                    quantity: 1,
                    quantityDamaged: 0,
                    purchasePrice: product.purchasePrice,
                    price: product.price,
                    isNew: false,
                }
            ]);
        }
    }, [items]);
    
    const handleAddNewItem = useCallback((name: string) => {
        const newItem: StockIntakeItem = {
            id: uuidv4(),
            name: name,
            barcodes: [],
            category: '',
            quantity: 1,
            quantityDamaged: 0,
            purchasePrice: 0,
            price: 0,
            isNew: true,
        };
        setItems(prev => [...prev, newItem]);
    }, []);

    const handleItemChange = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'purchasePrice' || field === 'quantity') {
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

    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);

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
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0) {
                toast.error(`Veuillez remplir les informations pour l'article "${item.name || 'Nouvel article'}". La quantité doit être > 0 et le prix d'achat >= 0.`);
                return;
            }
             if (item.quantityDamaged > item.quantity) {
                toast.error(`La quantité endommagée ne peut pas dépasser la quantité reçue pour "${item.name}".`);
                return;
            }
            if (item.isNew && item.price <= 0) {
                toast.error(`Veuillez définir un prix de vente pour le nouvel article "${item.name}".`);
                return;
            }
        }

        setIsSaving(true);
        try {
            const intakeData = { supplierUuid, supplierName, invoiceNumber, invoiceDate: invoiceDate || new Date() };
            await stockService.addStockIntake(intakeData, items);
            toast.success("Réception de stock enregistrée avec succès !");
            router.push('/stock');
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement", { description: error.message });
        } finally {
            setIsSaving(false);
        }
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

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Nouvelle Réception de Stock"
                description="Enregistrez les marchandises reçues de vos fournisseurs."
            >
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer la réception'}
                    </Button>
                </div>
            </PageHeader>

            <Card>
                <CardContent className="p-6 grid md:grid-cols-3 gap-6">
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
                                    <CommandInput 
                                        placeholder="Rechercher ou créer..." 
                                        onValueChange={setSupplierSearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <Button 
                                                variant="link" 
                                                className="w-full"
                                                onClick={handleSupplierCreate}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Créer le fournisseur "{supplierSearch}"
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {supplierOptions?.map((supplier) => (
                                                <CommandItem
                                                    key={supplier.uuid}
                                                    value={supplier.uuid}
                                                    onSelect={() => handleSupplierSelect(supplier.uuid)}
                                                >
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
                        <Label htmlFor="invoiceNumber">N° de Facture/Bon (Optionnel)</Label>
                        <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-12345" />
                    </div>
                    <div className="space-y-2">
                        <Label>Date de la facture</Label>
                        <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Articles Reçus</h3>
                    
                    <ProductIntakeCombobox 
                        onProductSelected={handleAddProduct}
                        onNewProductCreated={handleAddNewItem}
                    />
                    
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left">Produit</th>
                                    <th className="p-2 text-left w-32">Qté Reçue</th>
                                    <th className="p-2 text-left w-32">Qté Endommagée</th>
                                    <th className="p-2 text-left w-40">Prix Achat U.</th>
                                    <th className="p-2 text-left w-40">Prix Vente U.</th>
                                    <th className="p-2 text-right w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const isLoss = item.isNew && item.price > 0 && item.purchasePrice > 0 && item.price < item.purchasePrice;
                                    return (
                                        <tr key={item.id} className="border-b">
                                            <td className="p-2">
                                                {item.isNew ? (
                                                    <Input placeholder="Nom du nouveau produit" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                                ) : item.name}
                                            </td>
                                            <td className="p-2"><Input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></td>
                                            <td className="p-2"><Input type="number" min="0" value={item.quantityDamaged} onChange={e => handleItemChange(item.id, 'quantityDamaged', parseInt(e.target.value) || 0)} /></td>
                                            <td className="p-2"><Input type="number" min="0" step="0.1" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-2">
                                                <div className="relative">
                                                     <Input type="number" min="0" step="0.1" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} disabled={!item.isNew} />
                                                     {isLoss && (
                                                        <div className="absolute -bottom-5 left-0 text-xs text-destructive flex items-center gap-1">
                                                          <AlertTriangle className="h-3 w-3" /> Vente à perte
                                                        </div>
                                                     )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun article ajouté.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                     <div className="flex justify-end pt-4 border-t">
                        <div className="text-right">
                            <p className="text-muted-foreground">Valeur totale de la réception</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
