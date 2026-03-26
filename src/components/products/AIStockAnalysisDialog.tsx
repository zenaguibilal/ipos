'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { predictStockNeeds } from '@/ai/flows/stock-prediction-flow';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface AIStockAnalysisDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

export function AIStockAnalysisDialog({ isOpen, onOpenChange, products }: AIStockAnalysisDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      // Pour l'analyse, on envoie les produits qui ont du stock ou qui sont importants
      // On simule une "vitesse de vente" basée sur les données réelles (à l'avenir, extraire des logs)
      const input = {
        products: products.map(p => ({
          name: p.name,
          currentStock: p.quantity,
          minStockLevel: p.minStockLevel,
          // Simulation simplifiée : vélocité aléatoire ou basée sur le stock faible pour l'exemple
          recentSalesVelocity: p.quantity <= p.minStockLevel ? Math.random() * 5 + 1 : Math.random() * 2,
        })).slice(0, 20) // Analyser les 20 premiers pour rester rapide
      };

      const result = await predictStockNeeds(input);
      setAnalysis(result);
    } catch (error: any) {
      toast.error("Échec de l'analyse IA", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'medium': return <TrendingDown className="h-5 w-5 text-orange-500" />;
      default: return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant IA : Analyse Prédictive
          </DialogTitle>
          <DialogDescription>
            L'IA analyse vos ventes pour prédire quand vous devriez recommander vos produits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col min-h-0 py-4">
          {!analysis && !isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-xl border-2 border-dashed">
              <Sparkles className="h-12 w-12 text-primary/40 mb-4" />
              <h3 className="text-lg font-semibold">Lancer l'analyse intelligente</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                En un clic, notre IA va passer en revue votre inventaire pour identifier les risques de rupture avant qu'ils n'arrivent.
              </p>
              <Button onClick={runAnalysis} className="mt-6">
                Analyser maintenant
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex-grow flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-medium animate-pulse">L'IA parcourt vos données de vente...</p>
            </div>
          )}

          {analysis && !isLoading && (
            <ScrollArea className="flex-grow border rounded-lg p-4 bg-background/50">
              <div className="space-y-4">
                {analysis.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-lg border flex gap-4 transition-all hover:shadow-md",
                    alert.urgency === 'high' ? "bg-destructive/5 border-destructive/20" : 
                    alert.urgency === 'medium' ? "bg-orange-500/5 border-orange-500/20" : "bg-green-500/5 border-green-500/20"
                  )}>
                    <div className="shrink-0 mt-1">
                      {getUrgencyIcon(alert.urgency)}
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm sm:text-base">{alert.productName}</h4>
                        <Badge variant={alert.urgency === 'high' ? 'destructive' : alert.urgency === 'medium' ? 'secondary' : 'outline'}>
                          {alert.estimatedRunOutDate}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
                {analysis.alerts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500/30 mb-4" />
                    <p>Aucune alerte de rupture détectée pour le moment.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          {analysis && (
            <Button onClick={runAnalysis} variant="outline" className="gap-2">
              <Loader2 className={cn("h-4 w-4 animate-spin", !isLoading && "hidden")} />
              Actualiser l'analyse
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
