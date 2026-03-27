'use client';

import { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Loader2, UserPlus, ShieldCheck, Mail, Trash2, Edit, CheckCircle2, XCircle, Lock
} from "lucide-react";
import { useAppStore, useAppActions, useIsAdmin } from "@/stores/appStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Staff Management Component (Admin Restricted)
 */

export function StaffManagement() {
    const isAdmin = useIsAdmin();
    const { staff, isLoading } = useAppStore(state => ({
        staff: state.staff,
        isLoading: state.isLoading.staff
    }));
    const { refreshStaff } = useAppActions();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [isMutating, setIsMutating] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<any>('cashier');

    useEffect(() => {
        refreshStaff();
    }, [refreshStaff]);

    const handleOpenDialog = (member: any = null) => {
        if (!isAdmin) {
            toast.error("Privilèges insuffisants", { description: "Seul l'administrateur système peut modifier le personnel." });
            return;
        }
        setSelectedMember(member);
        if (member) {
            setEmail(member.email);
            setDisplayName(member.displayName);
            setRole(member.role);
        } else {
            setEmail('');
            setDisplayName('');
            setRole('cashier');
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsMutating(true);
        try {
            const data = { email, displayName, role };
            if (selectedMember) {
                await api.put(`staff/${selectedMember.uuid}`, data);
                toast.success("Droits d'accès mis à jour.");
            } else {
                await api.post('staff', data);
                toast.success("Nouvel accès collaborateur activé.");
            }
            refreshStaff();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("Échec de l'opération souveraine.");
        } finally {
            setIsMutating(false);
        }
    };

    const handleDelete = async (uuid: string) => {
        if (!isAdmin) return;
        if (!confirm("RÉVOCATION D'ACCÈS : Voulez-vous vraiment supprimer cet accès au terminal ?")) return;
        try {
            await api.delete(`staff/${uuid}`);
            toast.success("Accès définitivement révoqué.");
            refreshStaff();
        } catch (error) {
            toast.error("Erreur lors de la révocation.");
        }
    };

    const roleLabels: any = {
        admin: { label: 'Administrateur', color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' },
        manager: { label: 'Gérant', color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' },
        cashier: { label: 'Opérateur', color: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Registre des Pouvoirs</h3>
                    <p className="text-sm text-muted-foreground font-medium">Gestion hiérarchique des accès au terminal iPOS.</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 h-11 font-black uppercase text-[10px] tracking-[0.2em]">
                        <UserPlus className="mr-2 h-4 w-4" /> Activer un accès
                    </Button>
                )}
            </div>

            <div className="luxury-glass border-white/5 overflow-hidden rounded-[2rem] bg-muted/10 shadow-inner">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground px-6 py-4">Nom d'Usage</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Identifiant Cloud</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Niveau de Pouvoir</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">État Live</TableHead>
                            {isAdmin && <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground px-6">Contrôle</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary/50"/></TableCell></TableRow>
                        ) : staff.length === 0 ? (
                            <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center text-muted-foreground italic font-medium uppercase text-[10px] tracking-widest">Aucun registre personnel trouvé.</TableCell></TableRow>
                        ) : staff.map((member) => (
                            <TableRow key={member.uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                                <TableCell className="font-bold px-6 py-4">{member.displayName}</TableCell>
                                <TableCell className="font-mono text-[11px] opacity-70">{member.email}</TableCell>
                                <TableCell>
                                    <Badge className={cn("px-3 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase", roleLabels[member.role]?.color)}>
                                        <ShieldCheck className="h-2.5 w-2.5 mr-1.5" />
                                        {roleLabels[member.role]?.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {member.isActive ? (
                                        <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Actif
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-black uppercase opacity-50">
                                            <XCircle className="h-3 w-3" /> Suspendu
                                        </span>
                                    )}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => handleOpenDialog(member)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(member.uuid)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {!isAdmin && (
                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
                    <Lock className="h-4 w-4 text-orange-400" />
                    <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest">
                        Modification du registre réservée à l'administrateur système.
                    </p>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="luxury-glass border-white/10 sm:max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                {selectedMember ? 'Réglage de la Souveraineté' : 'Nouvelle Autorité Cloud'}
                            </DialogTitle>
                            <DialogDescription className="font-medium">Configurez les privilèges d'accès au terminal iPOS.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Identifiant Email (Unique)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@etablissement.dz" className="pl-10 h-11 rounded-xl bg-background/50" disabled={!!selectedMember} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Nom d'affichage au Terminal</Label>
                                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ex: Mohamed K." className="h-11 rounded-xl bg-background/50" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Hiérarchie (Rôle)</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="h-11 rounded-xl bg-background/50 border-white/5">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="luxury-glass border-white/10">
                                        <SelectItem value="admin" className="font-bold">Administrateur Système</SelectItem>
                                        <SelectItem value="manager" className="font-bold">Gérant d'Établissement</SelectItem>
                                        <SelectItem value="cashier" className="font-bold">Opérateur de Caisse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="border-t border-white/5 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Fermer</Button>
                            <Button type="submit" disabled={isMutating} className="bg-primary hover:bg-primary/90 px-8 rounded-xl shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest h-11">
                                {isMutating ? <Loader2 className="animate-spin h-4 w-4"/> : 'Graver les Pouvoirs'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
