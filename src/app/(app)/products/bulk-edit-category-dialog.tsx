
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface BulkEditCategoryDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (newCategory: string) => void;
    productCount: number;
}

export function BulkEditCategoryDialog({ isOpen, onOpenChange, onConfirm, productCount }: BulkEditCategoryDialogProps) {
  const [newCategory, setNewCategory] = useState('');
    
  if (productCount === 0) return null;

  const handleConfirmClick = () => {
    if (!newCategory.trim()) {
        toast.error("Veuillez entrer un nom de catégorie.");
        return;
    }
    onConfirm(newCategory.trim());
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewCategory('');
    }
    onOpenChange(open);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Changer la catégorie en masse</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de changer la catégorie pour {productCount} produit(s). 
            Entrez le nouveau nom de la catégorie ci-dessous. Si la catégorie n'existe pas, elle sera créée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
            <Label htmlFor="new-category-name" className="sr-only">Nom de la catégorie</Label>
            <Input
                id="new-category-name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Entrez le nom de la catégorie"
                autoFocus
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClick}
            disabled={!newCategory.trim()}
          >
            Confirmer et changer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
