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
    Loader2, UserPlus, ShieldCheck, Mail, Trash2, Edit, XCircle, Users, ShieldAlert, BadgeCheck, Activity, Power, PowerOff, CheckSquare, Square, 
    Lock, Package, Calculator, Building, History, Undo2, Wallet, Wheat, Coins, Settings2, ShoppingCart
} from "lucide-react";
import { useAppStore, useAppActions, useIsAdmin, useIsManagerOrAdmin } from "@/stores/appStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Separator } from '../ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * @fileOverview Staff Management Component (Sovereign Permission Control)
 * واجهة التحكم السيادية في الصلاحيات: اختيار الصفحات المتاحة لكل موظف بدقة.
 */

const PERMISSION_UNITS = [
    { slug: 'dashboard', label: 'Dashboard', icon: Activity, desc: 'Vue globale et stats' },
    { slug: 'sell', label: 'Caisse Live', icon: ShoppingCart, desc: 'Terminal de vente (F9)' },
    { slug: 'stock', label: 'Réceptions', icon: Package, desc: 'Gestion des entrées stock' },
    { slug: 'products', label: 'Catalogue', icon: Package, desc: 'Gestion des articles' },
    { slug: 'costing', label: 'Coûts', icon: Calculator, desc: 'Ingénierie des prix' },
    { slug: 'suppliers', label: 'Fournisseurs', icon: Building, desc: 'Registre partenaires' },
    { slug: 'customers', label: 'Clients', icon: Users, desc: 'Dettes et comptes' },
    { slug: 'sales-history', label: 'Journal', icon: History, desc: 'Archives des ventes' },
    { slug: 'returns', label: 'Retours', icon: Undo2, desc: 'Avoirs et régularisations' },
    { slug: 'expenses', label: 'Dépenses', icon: Wallet, desc: 'Registre des charges' },
    { slug: 'bread', label: 'Boulangerie', icon: Wheat, desc: 'Module distribution pain' },
    { slug: 'zakat', label: 'Zakat', icon: Coins, desc: 'Calculateur patrimonial' },
    { slug: 'settings', label: 'Paramètres', icon: Settings2, desc: 'Configuration système' },
];

export function StaffManagement() {
    const isAdmin = useIsAdmin();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { staff, isLoading } = useAppStore(state => ({
        staff: state.staff,
        isLoading: state.isLoading.staff,
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
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        if (isManagerOrAdmin) refreshStaff();
    }, [refreshStaff, isManagerOrAdmin]);

    const handleOpenDialog = (member: any = null) => {
        if (!isAdmin) {
            toast.error("Privilèges insuffisants pour gérer le personnel.");
            return;
        }
        setSelectedMember(member);
        if (member) {
            setEmail(member.email);
            setDisplayName(member.displayName);
            setRole(member.role);
            setIsActive(member.isActive);
            setPermissions(member.permissions || []);
        } else {
            setEmail('');
            setDisplayName('');
            setRole('cashier');
            setIsActive(true);
            setPermissions(['dashboard', 'sell', 'customers']); // Default basic permissions
        }
        setIsDialogOpen(true);
    };

    const togglePermission = (slug: string) => {
        setPermissions(prev => 
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;
        setIsMutating(true);
        try {
            const data = { email, displayName, role, isActive, permissions };
            if (selectedMember) {
                await api.put(`staff/${selectedMember.uuid}`, data);
                toast.success("Droits d'accès souverains mis à jour.");
            } else {
                await api.post('staff', data);
                toast.success("Nouvelle autorité collaborateur activée.");
            }
            refreshStaff();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("Échec de la validation cloud.");
        } finally {
            setIsMutating(false);
        }
    };

    const handleToggleStatus = async (member: any) => {
        if (!isAdmin) return;
        try {
            await api.put(`staff/${member.uuid}`, { ...member, isActive: !member.isActive });
            toast.success(member.isActive ? "Accès suspendu immédiatement." : "Accès réactivé.");
            refreshStaff();
        } catch (error) {
            toast.error("Erreur de modification de statut.");
        }
    };

    const handleDelete = async (uuid: string) => {
        if (!isAdmin) return;
        if (!confirm("RÉVOCATION DÉFINITIVE : Voulez-vous vraiment purger cet accès ?")) return;
        try {
            await api.delete(`staff/${uuid}`);
            toast.success("Compte révoqué et supprimé.");
            refreshStaff();
        } catch (error) {
            toast.error("Erreur lors de la révocation.");
        }
    };

    const roleLabels: any = {
        admin: { label: 'Administrateur', color: 'bg-primary' },
        manager: { label: 'Gérant', color: 'bg-blue-500' },
        cashier: { label: 'Opérateur', color: 'bg-orange-500' }
    };

    if (!isManagerOrAdmin) {
        return (
            <Card className="luxury-glass border-destructive/20 bg-destructive/5 p-16 text-center">
                <ShieldAlert className="h-20 w-20 text-destructive mx-auto mb-8 opacity-40 animate-pulse" />
                <h3 className="text-2xl font-black uppercase text-destructive italic">Accès Souverain Requis</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-50 mt-4">Vérification de grade en cours...</p>
            </Card>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Gestion du <span className="text-primary">Personnel</span></h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-[0.3em] opacity-60">Hiérarchie, autorités et contrôle d'accès unitaire</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 shadow-2xl rounded-2xl px-10 h-14 font-black uppercase text-[11px] tracking-[0.2em] group gap-3">
                        <UserPlus className="h-5 w-5" /> 
                        Déployer un accès
                    </Button>
                )}
            </div>

            <Card className="luxury-glass border-white/5 overflow-hidden rounded-[2.5rem] bg-muted/10 shadow-2xl">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground px-8 py-6">Identité Cloud</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Rang</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Unités Visibles</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">État Session</TableHead>
                            {isAdmin && <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground px-8">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-64 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary/30"/></TableCell></TableRow>
                        ) : staff.length === 0 ? (
                            <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-64 text-center text-muted-foreground italic">Aucun collaborateur enregistré.</TableCell></TableRow>
                        ) : staff.map((member) => (
                            <TableRow key={member.uuid} className={cn("border-white/5 hover:bg-white/5 transition-colors group", !member.isActive && "opacity-50")}>
                                <TableCell className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-12 w-12 rounded-2xl bg-background border border-white/10 flex items-center justify-center font-black text-lg shadow-inner", member.isActive ? "text-primary" : "text-muted-foreground")}>
                                            {member.displayName.substring(0,1).toUpperCase()}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-black text-base uppercase tracking-tight">{member.displayName}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground opacity-60">{member.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("px-4 py-1 rounded-xl text-[9px] font-black tracking-widest uppercase", roleLabels[member.role]?.color)}>
                                        {roleLabels[member.role]?.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                        {member.permissions?.length > 0 ? (
                                            member.permissions.slice(0, 3).map(p => (
                                                <Badge key={p} variant="outline" className="text-[8px] h-4 bg-white/5 border-white/10 uppercase font-black">{p}</Badge>
                                            ))
                                        ) : <span className="text-[9px] italic opacity-30">Accès restreint</span>}
                                        {member.permissions?.length > 3 && <span className="text-[8px] opacity-40 font-bold">+{member.permissions.length - 3}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {member.isActive ? (
                                        <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Actif
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase opacity-50">
                                            <XCircle className="h-4 w-4" /> Suspendu
                                        </span>
                                    )}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right px-8">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-white/10" onClick={() => handleToggleStatus(member)} title={member.isActive ? "Suspendre" : "Activer"}>
                                                {member.isActive ? <PowerOff className="h-4.5 w-4.5 text-orange-500" /> : <Power className="h-4.5 w-4.5 text-green-500" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-primary/10" onClick={() => handleOpenDialog(member)} title="Modifier permissions">
                                                <Edit className="h-4.5 w-4.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(member.uuid)} title="Révoquer">
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="luxury-glass border-white/10 sm:max-w-2xl rounded-[3rem] p-0 overflow-hidden shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="p-10 bg-primary/5 border-b border-white/5">
                            <DialogTitle className="flex items-center gap-4 text-3xl font-black uppercase italic">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                                {selectedMember ? 'Réglage des Pouvoirs' : 'Déploiement d\'Autorité'}
                            </DialogTitle>
                            <DialogDescription className="font-bold text-[11px] uppercase tracking-widest opacity-60 mt-3">Configuration des unités visibles و مصفوفة الصلاحيات.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase opacity-70 ml-1">E-mail Cloud</Label>
                                    <Input value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-xl bg-background/40 border-white/10 font-bold" disabled={!!selectedMember} required placeholder="email@exemple.dz" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black uppercase opacity-70 ml-1">Rang Hiérarchique</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger className="h-14 rounded-xl bg-background/40 border-white/10 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="luxury-glass">
                                            <SelectItem value="admin" className="font-bold py-3">Administrateur (Maître)</SelectItem>
                                            <SelectItem value="manager" className="font-bold py-3">Gérant (Exploitation)</SelectItem>
                                            <SelectItem value="cashier" className="font-bold py-3">Opérateur (Caisse)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase opacity-70 ml-1">Nom d'usage</Label>
                                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-14 rounded-xl bg-background/40 border-white/10 font-bold" required placeholder="Ex: Ahmed Cash" />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-primary" />
                                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Unités & Modules Accessibles</Label>
                                    </div>
                                    <Button type="button" variant="ghost" onClick={() => setPermissions(PERMISSION_UNITS.map(p => p.slug))} className="h-6 text-[8px] font-black uppercase px-2 hover:bg-primary/10">Tout autoriser</Button>
                                </div>
                                <ScrollArea className="h-72 rounded-2xl bg-white/5 border border-white/10 p-6 shadow-inner">
                                    <div className="grid grid-cols-1 gap-3">
                                        {PERMISSION_UNITS.map((unit) => (
                                            <div 
                                                key={unit.slug} 
                                                onClick={() => togglePermission(unit.slug)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group",
                                                    permissions.includes(unit.slug) 
                                                        ? "bg-primary/10 border-primary/30 text-primary shadow-lg" 
                                                        : "bg-background/40 border-white/5 opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-2 rounded-lg", permissions.includes(unit.slug) ? "bg-primary/20" : "bg-white/5")}>
                                                        <unit.icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest">{unit.label}</p>
                                                        <p className="text-[8px] opacity-50 uppercase font-bold">{unit.desc}</p>
                                                    </div>
                                                </div>
                                                {permissions.includes(unit.slug) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 opacity-20" />}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        <DialogFooter className="p-10 bg-white/5 border-t border-white/5 gap-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black h-14 flex-1">Annuler</Button>
                            <Button type="submit" disabled={isMutating} className="bg-primary hover:bg-primary/90 px-12 rounded-2xl shadow-2xl h-14 flex-[2] gap-3 uppercase font-black text-xs tracking-widest">
                                {isMutating ? <Loader2 className="animate-spin h-5 w-5"/> : <BadgeCheck className="h-5 w-5" />}
                                Graver les accès
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
