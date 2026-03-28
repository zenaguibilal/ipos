
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { 
    Palette, Sun, Moon, Monitor, LayoutGrid, List, 
    Sparkles, Zap, Maximize2, Minimize2, CheckCircle2,
    Scaling, ZoomIn, ZoomOut, RotateCcw, Eye, MonitorPlay
} from "lucide-react";
import { useAppStore, useAppActions } from "@/stores/appStore";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { toast } from "sonner";

/**
 * @fileOverview Display Settings Component (Sovereign UX Control - Finalized Perfection)
 * واجهة التحكم السيادية في تجربة المستخدم والهوية البصرية للمنظومة.
 */

export function DisplaySettings() {
    const { theme, setTheme } = useTheme();
    const { 
        productViewMode, customerViewMode, expenseViewMode, 
        stockViewMode, salesHistoryViewMode, supplierViewMode,
        isCompactMode, isMotionEnabled, interfaceScale, profile
    } = useAppStore();
    
    const { 
        setProductViewMode, setCustomerViewMode, setExpenseViewMode, 
        setStockViewMode, setSalesHistoryViewMode, setSupplierViewMode,
        setCompactMode, setMotionEnabled, setInterfaceScale, resetUIPreferences
    } = useAppActions();

    const handleReset = () => {
        resetUIPreferences();
        setTheme('system');
        toast.success("Interface réinitialisée aux valeurs d'usine iPOS.");
    };

    const ThemeCard = ({ value, label, icon: Icon }: { value: string, label: string, icon: any }) => (
        <button 
            onClick={() => setTheme(value)}
            className={cn(
                "flex-1 flex flex-col items-center gap-4 p-6 rounded-[2rem] border-2 transition-all duration-500 group relative overflow-hidden",
                theme === value 
                    ? "bg-primary/10 border-primary shadow-2xl shadow-primary/20 scale-[1.02]" 
                    : "bg-muted/10 border-white/5 hover:border-primary/30"
            )}
        >
            <div className={cn(
                "p-4 rounded-2xl transition-transform duration-500",
                theme === value ? "bg-primary text-primary-foreground rotate-6 shadow-lg shadow-primary/30" : "bg-white/5 group-hover:scale-110"
            )}>
                <Icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
            {theme === value && (
                <div className="absolute top-3 right-3 animate-in zoom-in-50 duration-300">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
            )}
        </button>
    );

    const ViewModeToggle = ({ label, current, onToggle }: { label: string, current: 'grid' | 'list', onToggle: (val: 'grid' | 'list') => void }) => (
        <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 border border-white/5 group hover:border-primary/20 transition-all hover:bg-white/[0.08]">
            <div className="space-y-0.5">
                <p className="text-[11px] font-black uppercase tracking-widest">{label}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-black opacity-40">Style d'affichage</p>
            </div>
            <div className="flex gap-1 p-1.5 bg-background/40 rounded-xl border border-white/10 shadow-inner">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-9 w-9 rounded-lg transition-all", current === 'grid' && "bg-primary text-primary-foreground shadow-lg")}
                    onClick={() => onToggle('grid')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-9 w-9 rounded-lg transition-all", current === 'list' && "bg-primary text-primary-foreground shadow-lg")}
                    onClick={() => onToggle('list')}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const scaleOptions = [
        { value: 80, label: '80%', desc: 'Micro' },
        { value: 90, label: '90%', desc: 'Compact' },
        { value: 100, label: '100%', desc: 'Standard' },
        { value: 110, label: '110%', desc: 'Large' },
        { value: 120, label: '120%', desc: 'Extra' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                <CardHeader className="bg-primary/5 border-b border-white/5 p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 rounded-[1.5rem] shadow-inner">
                            <Palette className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Personnalisation <span className="text-primary">Visuelle</span></CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center gap-2 mt-2">
                                <MonitorPlay className="h-3 w-3 text-primary animate-pulse" />
                                Adaptez l'interface iPOS à votre environnement
                            </CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset} className="rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 h-12 px-8 font-black uppercase text-[10px] tracking-[0.2em] shadow-sm">
                        <RotateCcw className="h-4 w-4 mr-2.5" />
                        Usine iPOS
                    </Button>
                </CardHeader>
                
                <CardContent className="p-10 space-y-16">
                    {/* Theme Selection */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Héritage Lumineux</h4>
                            </div>
                            <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[8px] px-3">Thème Dynamique</Badge>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <ThemeCard value="light" label="Clarté Warm" icon={Sun} />
                            <ThemeCard value="dark" label="Abysse Profond" icon={Moon} />
                            <ThemeCard value="system" label="Synchronisation" icon={Monitor} />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Interface Resolution / Scale */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Scaling className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Résolution & Mappage</h4>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 font-black text-xs text-primary">
                                {interfaceScale}%
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {scaleOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setInterfaceScale(opt.value)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-[1.5rem] border-2 transition-all duration-500 gap-3 group relative overflow-hidden",
                                        interfaceScale === opt.value 
                                            ? "bg-primary/10 border-primary text-primary shadow-2xl scale-[1.05]" 
                                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    {opt.value < 100 ? <ZoomOut className="h-5 w-5" /> : opt.value > 100 ? <ZoomIn className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                                    <div className="text-center">
                                        <p className="text-sm font-black tracking-tight">{opt.label}</p>
                                        <p className="text-[8px] font-black opacity-50 uppercase tracking-widest mt-0.5">{opt.desc}</p>
                                    </div>
                                    {interfaceScale === opt.value && <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* View Modes Selection */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <LayoutGrid className="h-5 w-5 text-primary" />
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Architecture des Registres</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ViewModeToggle label="Produits" current={productViewMode} onToggle={setProductViewMode} />
                            <ViewModeToggle label="Clients" current={customerViewMode} onToggle={setCustomerViewMode} />
                            <ViewModeToggle label="Fournisseurs" current={supplierViewMode} onToggle={setSupplierViewMode} />
                            <ViewModeToggle label="Mouvements Stock" current={stockViewMode} onToggle={setStockViewMode} />
                            <ViewModeToggle label="Journal Ventes" current={salesHistoryViewMode} onToggle={setSalesHistoryViewMode} />
                            <ViewModeToggle label="Charges Sortantes" current={expenseViewMode} onToggle={setExpenseViewMode} />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    {/* Advanced Visual Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <Minimize2 className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Optimisation de l'Espace</h4>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-muted/10 border border-white/10 flex items-center justify-between group hover:bg-muted/20 transition-colors">
                                <div className="space-y-2">
                                    <p className="text-base font-black uppercase tracking-tight">Mode Compact</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold opacity-60 max-w-[240px]">Réduction agressive des espacements pour les listes denses</p>
                                </div>
                                <Switch 
                                    checked={isCompactMode} 
                                    onCheckedChange={setCompactMode} 
                                    className="data-[state=checked]:bg-primary h-7 w-12" 
                                />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Hautes Performances</h4>
                            </div>
                            <div className="p-8 rounded-[2rem] bg-muted/10 border border-white/10 flex items-center justify-between group hover:bg-muted/20 transition-colors">
                                <div className="space-y-2">
                                    <p className="text-base font-black uppercase tracking-tight">Habilité Fluide</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold opacity-60 max-w-[240px]">Activer les transitions et micro-interactions de luxe</p>
                                </div>
                                <Switch 
                                    checked={isMotionEnabled} 
                                    onCheckedChange={setMotionEnabled} 
                                    className="data-[state=checked]:bg-primary h-7 w-12" 
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                
                <div className="p-10 bg-primary/5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-5 max-w-lg">
                        <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                            <Eye className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                            "Ces paramètres de confort sont persistants pour votre terminal. Ils garantissent que chaque session de travail iPOS reflète parfaitement vos préférences de lecture et de vitesse."
                        </p>
                    </div>
                    <div className="p-6 rounded-[1.5rem] bg-background/40 border border-white/10 shadow-inner min-w-[200px] text-center">
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-2">Simulation Monnaie</p>
                        <p className="text-xl font-black text-primary">{formatCurrency(1250.50)}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
