'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Save, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import type { StockIntakeItem, Product } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { dataService } from '@/services/data-service';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function NewStockIntakePage() {
    const router = useRouter();
    const [supplier, setSupplier] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>();
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setInvoiceDate(new Date());
        setIsMounted(true);
    }, []);

    const products = useLiveQuery(() => dataService.getAll<Product>('products'), []);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchQuery) return products;
        const lowerQuery = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.barcodes && p.barcodes.some(b => b.includes(lowerQuery)))
        );
    }, [products, searchQuery]);

    const handleAddProduct = (productId: string) => {
        const product = products?.find(p => String(p.id!) === productId);
        if (product) {
            setItems(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    productId: product.id as number,
                    name: product.name,
                    barcodes: product.barcodes || [],
                    category: product.category,
                    quantity: 1,
                    purchasePrice: product.purchasePrice,
                    price: product.price,
                    isNew: false,
                }
            ]);
        }
    };
    
    const handleAddNewItem = (name: string = '') => {
        const newItem: StockIntakeItem = {
            id: uuidv4(),
            name: name,
            barcodes: [],
            category: '',
            quantity: 1,
            purchasePrice: 0,
            price: 0,
            isNew: true,
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemChange = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'purchasePrice') {
                    // Default selling price to be 20% higher than purchase price for new items
                    if(updatedItem.isNew && updatedItem.price === 0) {
                        updatedItem.price = parseFloat(value) * 1.2;
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
        if (!supplier || !invoiceNumber || !invoiceDate) {
            toast.error("Veuillez remplir les informations sur le fournisseur et la facture.");
            return;
        }
        if (items.length === 0) {
            toast.error("Veuillez ajouter au moins un produit à la réception.");
            return;
        }

        for (const item of items) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice <= 0 || (item.isNew && item.price <= 0)) {
                toast.error(`Veuillez remplir toutes les informations pour l'article "${item.name || 'Nouvel article'}".`);
                return;
            }
        }

        setIsSaving(true);
        try {
            const intakeData = { supplier, invoiceNumber, invoiceDate };
            await dataService.addStockIntake(intakeData, items);
            toast.success("Réception de stock enregistrée avec succès !");
            router.push('/stock');
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement", { description: error.message });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                     <div>
                        <h1 className="text-2xl font-bold">Nouvelle Réception de Stock</h1>
                        <p className="text-muted-foreground">Enregistrez les marchandises reçues de vos fournisseurs.</p>
                     </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving || !isMounted}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Enregistrement...' : 'Enregistrer la réception'}
                </Button>
            </header>

            <Card>
                <CardContent className="p-6 grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="supplier">Fournisseur</Label>
                        <Input id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nom du fournisseur" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="invoiceNumber">N° de Facture/Bon</Label>
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
                    <div>
                       <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-full justify-between"
                                >
                                    Rechercher un produit ou en créer un nouveau...
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput 
                                        placeholder="Rechercher par nom ou code-barres..." 
                                        onValueChange={setSearchQuery} 
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <div className="text-center p-4 text-sm">
                                                Aucun produit trouvé.
                                                {searchQuery && (
                                                <Button 
                                                    variant="link" 
                                                    className="mt-1"
                                                    onClick={() => {
                                                        handleAddNewItem(searchQuery);
                                                        setComboboxOpen(false);
                                                        setSearchQuery('');
                                                    }}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Créer le produit "{searchQuery}"
                                                </Button>
                                                )}
                                            </div>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {filteredProducts?.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={String(product.id)}
                                                    onSelect={(currentValue) => {
                                                        handleAddProduct(currentValue);
                                                        setComboboxOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    <div>
                                                        <p>{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Stock: {product.quantity} | Prix Achat: {formatCurrency(product.purchasePrice)}
                                                        </p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left">Produit</th>
                                    <th className="p-2 text-left w-32">Qté</th>
                                    <th className="p-2 text-left w-40">Prix Achat (Unitaire)</th>
                                    <th className="p-2 text-left w-40">Prix Vente (Unitaire)</th>
                                    <th className="p-2 text-right w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">
                                            {item.isNew ? (
                                                <Input placeholder="Nom du nouveau produit" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                            ) : item.name}
                                        </td>
                                        <td className="p-2"><Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></td>
                                        <td className="p-2"><Input type="number" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="p-2"><Input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} disabled={!item.isNew} /></td>
                                        <td className="p-2 text-right">
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun article ajouté.</td>
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
