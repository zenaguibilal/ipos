'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table"
import { Keyboard } from "lucide-react";


interface ShortcutsHelpDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const shortcuts = [
    { key: "F1", description: "Afficher cette fenêtre d'aide" },
    { key: "F2", description: "Mettre le focus sur la recherche de produit" },
    { key: "F4", description: "Finaliser la vente et ouvrir la fenêtre de paiement" },
    { key: "Alt + A", description: "Ouvrir le formulaire 'Produit Personnalisé'" },
    { key: "Alt + N", description: "Ouvrir le formulaire 'Nouveau Produit'" },
];

export function ShortcutsHelpDialog({ isOpen, onOpenChange }: ShortcutsHelpDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-6 w-6" />
            Raccourcis Clavier
          </DialogTitle>
          <DialogDescription>
            Utilisez ces raccourcis pour accélérer votre processus de vente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Raccourci</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shortcuts.map((shortcut) => (
                        <TableRow key={shortcut.key}>
                            <TableCell>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    {shortcut.key}
                                </kbd>
                            </TableCell>
                            <TableCell>{shortcut.description}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
