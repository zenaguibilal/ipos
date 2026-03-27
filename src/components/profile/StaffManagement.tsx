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
    Loader2, UserPlus, ShieldCheck, Mail, Trash2, Edit, CheckCircle2, XCircle, Lock, Users, ShieldAlert, BadgeCheck, Info, HelpCircle, Activity, Power, PowerOff
} from "lucide-react";
import { useAppStore, useAppActions, useIsAdmin, useIsManagerOrAdmin } from "@/stores/appStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Separator } from '../ui/separator';

/**
 * @fileOverview Staff Management Component (Refined Authority)
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
    const [isActive, setIsActive] = useState(true);

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
            setIsActive(member.isActive);
        } else {
            setEmail('');
            setDisplayName('');
            setRole('cashier');
            setIsActive(true);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsMutating(true);
        try {
            const data = { email, displayName, role, isActive };
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

    const handleToggleStatus = async (member: any) => {
        if (!isAdmin) return;
        try {
            await api.put(`staff/${member.uuid}`, { ...member, isActive: !member.isActive });
            toast.success(member.isActive ? "Accès suspendu" : "Accès réactivé");
            refreshStaff();
        } catch (error) {
            toast.error("Erreur de modification du statut.");
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
        admin: { label: 'Administrateur', color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20', longDesc: 'Accès total à la configuration, au personnel et aux bases de données.' },
        manager: { label: 'Gérant', color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20', longDesc: 'Gestion des stocks, fournisseurs, tarifs et rapports opérationnels.' },
        cashier: { label: 'Opérateur', color: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20', longDesc: 'Interface de vente, encaissements et retours clients uniquement.' }
    };

    if (!isManagerOrAdmin) {
        return (
            <Card className="luxury-glass border-destructive/20 bg-destructive/5 p-16 text-center">
                <ShieldAlert className="h-20 w-20 text-destructive mx-auto mb-8 opacity-40 animate-pulse" />
                <h3 className="text-2xl font-black uppercase tracking-widest text-destructive italic">Accès Souverain Requis</h3>
                <p className="text-sm text-muted-foreground mt-4 max-w-sm mx-auto leading-relaxed">
                    Le registre du personnel est une archive confidentielle. Seul un gestionnaire authentifié peut consulter la liste des autorités du terminal.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Legend & Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter italic">Registre des <span className="text-primary">Pouvoirs</span></h3>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.3em] opacity-60">Hiérarchie & Autorités du Terminal iPOS</p>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-2xl px-10 h-14 font-black uppercase text-[11px] tracking-[0.2em] group gap-3">
                                <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
                                Activer un accès
                            </Button>
                        )}
                    </div>

                    <Card className="luxury-glass border-white/5 overflow-hidden rounded-[2.5rem] bg-muted/10">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground px-8 py-6">Identité</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Niveau d'Autorité</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">État Live</TableHead>
                                    {isAdmin && <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground px-8">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="h-64 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary/30"/></TableCell></TableRow>
                                ) : staff.length === 0 ? (
                                    <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="h-64 text-center text-muted-foreground italic font-medium uppercase text-[11px] tracking-widest opacity-40">Aucun registre personnel trouvé dans le nuage.</TableCell></TableRow>
                                ) : staff.map((member) => (
                                    <TableRow key={member.uuid} className={cn("border-white/5 hover:bg-white/5 transition-colors group", !member.isActive && "opacity-50")}>
                                        <TableCell className="font-black px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-background border border-white/10 flex items-center justify-center font-black text-lg text-primary shadow-inner">
                                                    {member.displayName.substring(0,1).toUpperCase()}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-base">{member.displayName}</p>
                                                    <p className="text-[10px] font-mono text-muted-foreground opacity-60">{member.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("px-5 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase", roleLabels[member.role]?.color)}>
                                                <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                                {roleLabels[member.role]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.isActive ? (
                                                <span className="flex items-center gap-2.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" /> 
                                                    Opérationnel
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase opacity-50">
                                                    <XCircle className="h-4 w-4" /> Suspendu
                                                </span>
                                            )}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right px-8">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-white/10" onClick={() => handleToggleStatus(member)} title={member.isActive ? "Suspendre" : "Activer"}>
                                                        {member.isActive ? <PowerOff className="h-4.5 w-4.5 text-orange-500" /> : <Power className="h-4.5 w-4.5 text-green-500" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-primary/10 hover:text-primary" onClick={() => handleOpenDialog(member)}>
                                                        <Edit className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(member.uuid)}>
                                                        <Trash2 className="h-4.5 w-4.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="luxury-glass border-white/5 bg-muted/10 p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Guide des Pouvoirs</h4>
                        </div>
                        
                        <div className="space-y-8">
                            {Object.entries(roleLabels).map(([key, info]: any) => (
                                <div key={key} className="space-y-2 relative pl-6 border-l-2 border-white/10 hover:border-primary/30 transition-colors">
                                    <div className={cn("absolute -left-1.5 top-0 h-3 w-3 rounded-full shadow-lg", info.color.split(' ')[0])} />
                                    <p className="text-[11px] font-black uppercase tracking-widest">{info.label}</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">{info.longDesc}</p>
                                </div>
                            ))}
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-primary mb-1">Sécurité</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Un accès suspendu empêche toute connexion immédiate mais conserve l'historique des actions de l'utilisateur.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="luxury-glass border-white/10 sm:max-w-lg rounded-[3rem] p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-10 bg-primary/5 border-b border-white/5 text-left">
                            <DialogTitle className="flex items-center gap-4 text-3xl font-black uppercase tracking-tighter italic">
                                <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                {selectedMember ? 'Réglage de Pouvoir' : 'Nouvelle Autorité Cloud'}
                            </DialogTitle>
                            <DialogDescription className="font-bold text-[11px] uppercase tracking-widest opacity-60 mt-3 flex items-center gap-2">
                                <Activity className="h-3 w-3 text-primary animate-pulse" />
                                Configuration des privilèges d'accès au terminal iPOS.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-8 p-10">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70 ml-1">Email du Collaborateur (Identifiant Cloud)</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        placeholder="identifiant@commerce.dz" 
                                        className="pl-14 h-16 rounded-[1.5rem] bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-base" 
                                        disabled={!!selectedMember} 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70 ml-1">Nom d'affichage (Identité Locale)</Label>
                                <Input 
                                    value={displayName} 
                                    onChange={e => setDisplayName(e.target.value)} 
                                    placeholder="Ex: Mohamed K." 
                                    className="h-16 rounded-[1.5rem] bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-base" 
                                    required 
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70 ml-1">Niveau Hiérarchique (Autorité)</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="h-16 rounded-[1.5rem] bg-background/40 border-white/10 focus:ring-0 font-bold text-base px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="luxury-glass border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                        <SelectItem value="admin" className="font-bold py-4 hover:bg-primary/5 transition-colors">Administrateur Système</SelectItem>
                                        <SelectItem value="manager" className="font-bold py-4 hover:bg-primary/5 transition-colors">Gérant d'Étabلisement</SelectItem>
                                        <SelectItem value="cashier" className="font-bold py-4 hover:bg-primary/5 transition-colors">Opérateur de Caisse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="p-10 bg-white/5 border-t border-white/5 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl font-black uppercase text-[11px] tracking-widest h-14 flex-1">Fermer</Button>
                            <Button type="submit" disabled={isMutating} className="bg-primary hover:bg-primary/90 px-12 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-[11px] tracking-[0.2em] h-14 flex-1 gap-3 hover:scale-105 active:scale-95 transition-all">
                                {isMutating ? <Loader2 className="animate-spin h-5 w-5"/> : <BadgeCheck className="h-5 w-5" />}
                                Graver les Pouvoirs
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
