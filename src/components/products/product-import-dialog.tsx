
'use client';

import { useState, useRef, ChangeEvent } from 'react';
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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface ProductImportDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (file: File) => void;
}

export function ProductImportDialog({ isOpen, onOpenChange, onConfirm }: ProductImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleConfirmClick = () => {
    if (selectedFile) {
      onConfirm(selectedFile);
      onOpenChange(false);
    } else {
      toast.error("Veuillez sélectionner un fichier CSV à importer.");
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
    }
    onOpenChange(open);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Importer des produits depuis un fichier CSV</AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              Sélectionnez un fichier CSV pour ajouter ou mettre à jour des produits en masse.
              Le fichier doit contenir les colonnes suivantes : `name`, `purchasePrice`, `price`, `quantity`, `minStockLevel`, `barcodes`.
            </p>
            <p className="mt-2 text-destructive font-medium">
              Attention : L'importation mettra à jour les produits existants s'ils ont le même `name`. Cette action est irréversible.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="csv-file">Fichier CSV</Label>
          <Input 
            id="csv-file"
            type="file" 
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange} 
          />
           {selectedFile && <p className="text-sm text-muted-foreground mt-2">Fichier sélectionné : {selectedFile.name}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmClick} 
            disabled={!selectedFile}
          >
            Importer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
