
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
    Loader2, UserPlus, ShieldCheck, Mail, Trash2, Edit, CheckCircle2, XCircle, Lock, Users, ShieldAlert, BadgeCheck
} from "lucide-react";
import { useAppStore, useAppActions, useIsAdmin, useIsManagerOrAdmin } from "@/stores/appStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Staff Management Component (Admin Restricted for mutation)
 */

export function StaffManagement() {
    const isAdmin = useIsAdmin();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { staff, isLoading, profile } = useAppStore(state => ({
        staff: state.staff,
        isLoading: state.isLoading.staff,
        profile: state.profile
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
        if (isManagerOrAdmin) refreshStaff();
    }, [refreshStaff, isManagerOrAdmin]);

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

    if (!isManagerOrAdmin) {
        return (
            <Card className="luxury-glass border-destructive/20 bg-destructive/5 p-12 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-black uppercase tracking-widest text-destructive">Accès Restreint</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Le registre du personnel est confidentiel. Seul un gestionnaire peut consulter la liste des autorités locales.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Registre des <span className="text-primary">Pouvoirs</span></h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">Hiérarchie & Autorités du Terminal iPOS</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] group">
                        <UserPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> 
                        Activer un accès
                    </Button>
                )}
            </div>

            <Card className="luxury-glass border-white/5 overflow-hidden rounded-[2.5rem] bg-muted/10">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground px-8 py-5">Identité</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Email Solaire</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Niveau d'Autorité</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">État Live</TableHead>
                            {isAdmin && <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground px-8">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-48 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary/30"/></TableCell></TableRow>
                        ) : staff.length === 0 ? (
                            <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-48 text-center text-muted-foreground italic font-medium uppercase text-[10px] tracking-widest opacity-40">Aucun registre personnel trouvé dans le nuage.</TableCell></TableRow>
                        ) : staff.map((member) => (
                            <TableRow key={member.uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                                <TableCell className="font-black px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-background border border-white/10 flex items-center justify-center font-black text-primary">
                                            {member.displayName.substring(0,1).toUpperCase()}
                                        </div>
                                        {member.displayName}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                                    {member.email}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("px-4 py-1 rounded-xl text-[9px] font-black tracking-widest uppercase", roleLabels[member.role]?.color)}>
                                        <ShieldCheck className="h-3 w-3 mr-2" />
                                        {roleLabels[member.role]?.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {member.isActive ? (
                                        <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> 
                                            Actif
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase opacity-50">
                                            <XCircle className="h-3.5 w-3.5" /> Suspendu
                                        </span>
                                    )}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right px-8">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => handleOpenDialog(member)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(member.uuid)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="luxury-glass border-white/5 bg-primary/5 p-6 border-l-4 border-l-primary">
                    <div className="flex items-start gap-4">
                        <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight mb-1">Protection de la Hiérarchie</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Les modifications du registre sont irréversibles et archivées. Assurez-vous de l'identité des collaborateurs avant toute délégation de pouvoir.
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="luxury-glass border-white/5 bg-blue-500/5 p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-4">
                        <BadgeCheck className="h-6 w-6 text-blue-400 shrink-0" />
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight mb-1">Vérification Cloud</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Chaque compte est lié à une adresse email unique. L'accès est instantané dès la validation des décrets par l'administrateur.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="luxury-glass border-white/10 sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-8 bg-primary/5 border-b border-white/5 text-left">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter italic">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                {selectedMember ? 'Réglage de Pouvoir' : 'Nouvelle Autorité Cloud'}
                            </DialogTitle>
                            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60 mt-2">
                                Configuration des privilèges d'accès au terminal iPOS.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-6 p-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 ml-1">Email du Collaborateur</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        placeholder="identifiant@commerce.dz" 
                                        className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold" 
                                        disabled={!!selectedMember} 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 ml-1">Nom d'affichage</Label>
                                <Input 
                                    value={displayName} 
                                    onChange={e => setDisplayName(e.target.value)} 
                                    placeholder="Ex: Mohamed K." 
                                    className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold" 
                                    required 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 ml-1">Niveau Hiérarchique (Rôle)</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-background/40 border-white/5 focus:ring-0 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="luxury-glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                        <SelectItem value="admin" className="font-bold py-3 hover:bg-primary/5">Administrateur Système</SelectItem>
                                        <SelectItem value="manager" className="font-bold py-3 hover:bg-primary/5">Gérant d'Établissement</SelectItem>
                                        <SelectItem value="cashier" className="font-bold py-3 hover:bg-primary/5">Opérateur de Caisse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-white/5 border-t border-white/5 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest flex-1">Fermer</Button>
                            <Button type="submit" disabled={isMutating} className="bg-primary hover:bg-primary/90 px-10 rounded-xl shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-[0.2em] h-12 flex-1 gap-2">
                                {isMutating ? <Loader2 className="animate-spin h-4 w-4"/> : <BadgeCheck className="h-4 w-4" />}
                                Graver les Pouvoirs
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
