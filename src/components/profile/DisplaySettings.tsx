
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { 
    Palette, Sun, Moon, Monitor, LayoutGrid, List, 
    Sparkles, Zap, Maximize2, Minimize2, CheckCircle2 
} from "lucide-react";
import { useAppStore, useAppActions } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useEffect } from "react";

/**
 * @fileOverview Display Settings Component (Sovereign UX Control)
 * واجهة التحكم السيادية في تجربة المستخدم والهوية البصرية للمنظومة.
 */

export function DisplaySettings() {
    const { theme, setTheme } = useTheme();
    const { 
        productViewMode, customerViewMode, expenseViewMode, 
        stockViewMode, salesHistoryViewMode, supplierViewMode,
        isCompactMode, isMotionEnabled
    } = useAppStore();
    
    const { 
        setProductViewMode, setCustomerViewMode, setExpenseViewMode, 
        setStockViewMode, setSalesHistoryViewMode, setSupplierViewMode,
        setCompactMode, setMotionEnabled
    } = useAppActions();

    // Effect to apply compact mode to body
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.classList.toggle('compact-mode', isCompactMode);
        }
    }, [isCompactMode]);

    // Effect to apply reduced motion to body
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.classList.toggle('reduce-motion', !isMotionEnabled);
        }
    }, [isMotionEnabled]);

    const ThemeCard = ({ value, label, icon: Icon }: { value: string, label: string, icon: any }) => (
        <button 
            onClick={() => setTheme(value)}
            className={cn(
                "flex-1 flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all duration-500 group relative overflow-hidden",
                theme === value 
                    ? "bg-primary/10 border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                    : "bg-muted/10 border-white/5 hover:border-primary/30"
            )}
        >
            <div className={cn(
                "p-4 rounded-2xl transition-transform duration-500",
                theme === value ? "bg-primary text-primary-foreground rotate-6" : "bg-white/5 group-hover:scale-110"
            )}>
                <Icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            {theme === value && (
                <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
            )}
        </button>
    );

    const ViewModeToggle = ({ label, current, onToggle }: { label: string, current: 'grid' | 'list', onToggle: (val: 'grid' | 'list') => void }) => (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
            <div className="space-y-0.5">
                <p className="text-[11px] font-black uppercase tracking-widest">{label}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold opacity-60">Style d'affichage par défaut</p>
            </div>
            <div className="flex gap-1 p-1 bg-background/40 rounded-xl border border-white/10 shadow-inner">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 rounded-lg", current === 'grid' && "bg-primary text-primary-foreground shadow-lg")}
                    onClick={() => onToggle('grid')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 rounded-lg", current === 'list' && "bg-primary text-primary-foreground shadow-lg")}
                    onClick={() => onToggle('list')}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                <CardHeader className="bg-primary/5 border-b border-white/5 p-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Palette className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Environnement Visuel</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Personnalisez l'atmosphère de votre terminal de commande</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 space-y-12">
                    {/* Theme Selection */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Héritage Lumineux</h4>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <ThemeCard value="light" label="Mode Clair" icon={Sun} />
                            <ThemeCard value="dark" label="Mode Sombre" icon={Moon} />
                            <ThemeCard value="system" label="Système" icon={Monitor} />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* View Modes Selection */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <LayoutGrid className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Anatomie des Registres</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ViewModeToggle label="Produits" current={productViewMode} onToggle={setProductViewMode} />
                            <ViewModeToggle label="Clients" current={customerViewMode} onToggle={setCustomerViewMode} />
                            <ViewModeToggle label="Fournisseurs" current={supplierViewMode} onToggle={setSupplierViewMode} />
                            <ViewModeToggle label="Mouvements Stock" current={stockViewMode} onToggle={setStockViewMode} />
                            <ViewModeToggle label="Journal Ventes" current={salesHistoryViewMode} onToggle={setSalesHistoryViewMode} />
                            <ViewModeToggle label="Charges" current={expenseViewMode} onToggle={setExpenseViewMode} />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Advanced Visual Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Minimize2 className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em]">Densité de Données</h4>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Mode Compact</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-black opacity-60">Réduire l'espacement pour les listes denses</p>
                                </div>
                                <Switch 
                                    checked={isCompactMode} 
                                    onCheckedChange={setCompactMode} 
                                    className="data-[state=checked]:bg-primary" 
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em]">Hautes Performances</h4>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Fluidité Maximale</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-black opacity-60">Activer les transitions et animations de luxe</p>
                                </div>
                                <Switch 
                                    checked={isMotionEnabled} 
                                    onCheckedChange={setMotionEnabled} 
                                    className="data-[state=checked]:bg-primary" 
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <div className="p-10 bg-primary/5 border-t border-white/5 flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Monitor className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                        "Les paramètres d'affichage sont stockés dans votre session de travail actuelle pour garantir un confort visuel optimal sans impacter les autres postes de travail de votre instance iPOS Cloud."
                    </p>
                </div>
            </Card>
        </div>
    );
}
