'use client';

import { useState } from 'react';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Archive, Save } from 'lucide-react';
import { toast } from 'sonner';

export function DraftsDropdown() {
    const { carts, activeCartId } = useAppStore();
    const { createNewCart, switchToCart, saveActiveCartAsDraft, deleteCart } = useAppActions();
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [draftName, setDraftName] = useState('');
    
    const activeCart = carts.find(c => c.id === activeCartId);

    const handleSaveDraft = () => {
        if (!draftName.trim()) {
            toast.error("Veuillez donner un nom au brouillon.");
            return;
        }
        saveActiveCartAsDraft(draftName);
        setIsSaveDialogOpen(false);
        setDraftName('');
        toast.success(`Panier sauvegardé en tant que "${draftName}".`);
    }

    const handleDelete = (e: React.MouseEvent, cartId: string) => {
        e.stopPropagation();
        deleteCart(cartId);
        toast.success("Brouillon supprimé.");
    }
    
    return (
        <>
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sauvegarder le panier</DialogTitle>
                        <DialogDescription>Donnez un nom à ce panier pour le retrouver plus tard.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="draft-name">Nom du brouillon</Label>
                        <Input 
                            id="draft-name" 
                            value={draftName} 
                            onChange={e => setDraftName(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSaveDraft()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveDraft}>Sauvegarder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Archive className="mr-2 h-4 w-4" />
                        <span>{activeCart?.name || 'Panier Actif'}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Gestion des Paniers</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setIsSaveDialogOpen(true)}>
                        <Save className="mr-2 h-4 w-4" />
                        Sauvegarder le panier actuel
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={createNewCart}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Panier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                         <DropdownMenuLabel className="text-xs text-muted-foreground">Paniers Sauvegardés</DropdownMenuLabel>
                        {carts.map(cart => (
                            <DropdownMenuItem key={cart.id} onSelect={() => switchToCart(cart.id)} className={cart.id === activeCartId ? 'bg-accent' : ''}>
                                <span className="flex-grow truncate">{cart.name} ({cart.items.length} art.)</span>
                                {cart.id !== activeCartId && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 ml-2 text-destructive/70 hover:text-destructive"
                                        onClick={(e) => handleDelete(e, cart.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
